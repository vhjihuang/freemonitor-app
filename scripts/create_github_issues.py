#!/usr/bin/env python3
"""
GitHub Issues 自动创建脚本
根据 docs/project-plan-structured.json 中的任务信息自动创建 GitHub Issues
"""

import os
import json
import sys
from github import Github
from typing import List, Dict, Any


class GitHubIssueCreator:
    def __init__(self, token: str, repo_name: str):
        self.github = Github(token)
        self.repo = self.github.get_repo(repo_name)
        self.label_cache = set()
        self._initialize_labels()
        
    def _initialize_labels(self):
        """初始化标签缓存"""
        try:
            labels = self.repo.get_labels()
            for label in labels:
                self.label_cache.add(label.name)
        except Exception as e:
            print(f"警告: 无法获取现有标签: {e}")
            
    def _create_label_if_not_exists(self, label_name: str, color: str = "0075ca", description: str = ""):
        """如果标签不存在则创建标签"""
        if label_name not in self.label_cache:
            try:
                self.repo.create_label(
                    name=label_name,
                    color=color,
                    description=description
                )
                self.label_cache.add(label_name)
                print(f"已创建标签: {label_name}")
            except Exception as e:
                print(f"警告: 无法创建标签 {label_name}: {e}")
                
    def _get_priority_labels(self, priority: str) -> List[str]:
        """根据优先级返回标签"""
        # 从文档中的符号映射到标签
        priority_map = {
            '🔴 高优先级': ['priority-high', 'high'],
            '🟡 中优先级': ['priority-medium', 'medium'],
            '🟢 低优先级': ['priority-low', 'low'],
            '🔴': ['priority-high', 'high'],
            '🟡': ['priority-medium', 'medium'],
            '🟢': ['priority-low', 'low']
        }
        return priority_map.get(priority, ['priority-medium'])
        
    def _get_status_labels(self, status: str) -> List[str]:
        """根据状态返回标签"""
        status_map = {
            '✅ 已完成': ['status-done', 'completed'],
            '🔄 进行中': ['status-in-progress', 'in-progress'],
            '⏸ 暂停/待定': ['status-paused', 'paused'],
            '☐ 未开始': ['status-pending', 'pending'],
            '✅': ['status-done', 'completed'],
            '🔄': ['status-in-progress', 'in-progress'],
            '⏸': ['status-paused', 'paused'],
            '☐': ['status-pending', 'pending']
        }
        return status_map.get(status, ['status-pending'])
        
    def _format_task_body(self, task: Dict[str, Any], phase: str) -> str:
        """格式化任务内容为Issue正文"""
        body = f"# {task.get('title', '未命名任务')}\n\n"
        
        # 添加状态信息
        body += f"## 状态\n\n"
        body += f"- **当前状态**: {task.get('status', '☐ 未开始')}\n"
        if task.get('completionDate'):
            body += f"- **完成日期**: {task.get('completionDate')}\n"
        body += "\n"
        
        # 添加阶段信息
        body += f"## 阶段信息\n\n"
        body += f"- **所属阶段**: {phase}\n"
        body += f"- **优先级**: {self._extract_priority_from_phase(phase)}\n\n"
        
        # 添加任务描述（如果存在）
        if task.get('description'):
            body += f"## 任务描述\n\n{task['description']}\n\n"
        
        # 添加实现逻辑（如果存在）
        if task.get('implementation_logic'):
            body += f"## 实现逻辑\n\n{task['implementation_logic']}\n\n"
        
        # 添加验收标准（如果存在）
        if task.get('acceptance_criteria'):
            body += "## 验收标准\n\n"
            if isinstance(task['acceptance_criteria'], list):
                for criterion in task['acceptance_criteria']:
                    body += f"- [ ] {criterion}\n"
            else:
                body += f"{task['acceptance_criteria']}\n"
            body += "\n"
        
        # 添加相关文件（如果存在）
        if task.get('related_files'):
            body += "## 相关文件\n\n"
            if isinstance(task['related_files'], list):
                for file_path in task['related_files']:
                    body += f"- `{file_path}`\n"
            else:
                body += f"- `{task['related_files']}`\n"
            body += "\n"
        
        # 添加依赖关系（如果存在）
        if task.get('dependencies'):
            body += "## 依赖关系\n\n"
            if isinstance(task['dependencies'], list):
                for dependency in task['dependencies']:
                    body += f"- {dependency}\n"
            else:
                body += f"- {task['dependencies']}\n"
            body += "\n"
        
        # 添加自动创建标识
        body += "---\n"
        body += "<!-- 此Issue由自动化脚本创建 -->\n"
        
        return body
    
    def _extract_priority_from_phase(self, phase: str) -> str:
        """从阶段信息中提取优先级"""
        if "🔴" in phase:
            return "🔴 高优先级"
        elif "🟡" in phase:
            return "🟡 中优先级"
        elif "🟢" in phase:
            return "🟢 低优先级"
        else:
            return "🟡 中优先级"
        
    def create_issue(self, task: Dict[str, Any], phase: str) -> str:
        """创建单个Issue"""
        # 准备标签
        labels = ["task", "automated"]
        
        # 添加优先级标签（从阶段信息中提取）
        priority = self._extract_priority_from_phase(phase)
        labels.extend(self._get_priority_labels(priority))
        
        # 添加状态标签
        status = task.get('status', '☐ 未开始')
        labels.extend(self._get_status_labels(status))
        
        # 添加阶段标签
        # 提取阶段名称（去除符号和进度百分比）
        clean_phase = phase.split('[')[0].strip()
        clean_phase = clean_phase.replace('🔴', '').replace('🟡', '').replace('🟢', '').strip()
        if clean_phase:
            labels.append(f"phase-{clean_phase}")
            
        # 确保标签存在
        for label in labels:
            # 标准化标签名（移除特殊字符，转换为小写）
            clean_label = label.lower().replace(' ', '-').replace('/', '-').replace('[', '').replace(']', '')
            self._create_label_if_not_exists(clean_label)
            
        # 格式化标题
        title = f"[{clean_phase}] {task.get('title', '未命名任务')}"
        if len(title) > 250:  # GitHub标题限制
            title = title[:247] + "..."
            
        # 格式化内容
        body = self._format_task_body(task, phase)
        
        try:
            # 检查是否已存在相同标题的Issue
            existing_issues = self.repo.get_issues(state='all')
            for issue in existing_issues:
                if issue.title == title:
                    print(f"跳过已存在的Issue: {title}")
                    return f"已存在: {issue.html_url}"
                    
            # 创建Issue
            issue = self.repo.create_issue(
                title=title,
                body=body,
                labels=labels
            )
            
            print(f"已创建Issue: {title}")
            return issue.html_url
            
        except Exception as e:
            print(f"创建Issue失败: {title} - {e}")
            return f"创建失败: {e}"
            
    def create_issues_from_docs(self, json_file: str) -> List[str]:
        """从docs中的JSON文件创建Issues"""
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            issue_urls = []
            
            # 遍历所有阶段的详细任务
            for phase_detail in data.get('phaseDetails', []):
                phase = phase_detail.get('phase', '')
                tasks = phase_detail.get('tasks', [])
                
                for task in tasks:
                    url = self.create_issue(task, phase)
                    issue_urls.append(url)
                
            return issue_urls
            
        except FileNotFoundError:
            print(f"错误: 找不到文件 {json_file}")
            return []
        except json.JSONDecodeError as e:
            print(f"错误: 无法解析JSON文件 {json_file} - {e}")
            return []
        except Exception as e:
            print(f"错误: {e}")
            return []


def main():
    # 检查环境变量
    token = os.environ.get('GITHUB_TOKEN')
    repo_name = os.environ.get('GITHUB_REPOSITORY')
    
    if not token:
        print("错误: 请设置GITHUB_TOKEN环境变量")
        sys.exit(1)
        
    if not repo_name:
        print("错误: 请设置GITHUB_REPOSITORY环境变量")
        sys.exit(1)
        
    # 获取当前工作目录
    current_dir = os.getcwd()
    json_file = os.path.join(current_dir, "docs", "project-plan-structured.json")
    
    print(f"当前工作目录: {current_dir}")
    print(f"JSON文件路径: {json_file}")
    
    # 检查文件是否存在
    if not os.path.exists(json_file):
        print(f"错误: 找不到文件 {json_file}")
        sys.exit(1)
        
    # 创建Issue创建器
    creator = GitHubIssueCreator(token, repo_name)
    
    # 从docs中的JSON文件创建Issues
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
        
    urls = creator.create_issues_from_docs(json_file)
    
    print(f"\n创建了 {len(urls)} 个Issues:")
    for url in urls:
        print(url)


if __name__ == "__main__":
    main()