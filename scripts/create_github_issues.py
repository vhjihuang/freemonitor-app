#!/usr/bin/env python3
"""
GitHub Issues 自动创建脚本
根据解析出的任务信息自动创建 GitHub Issues
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
        priority_map = {
            '高优先级': ['priority-high', 'high'],
            '中优先级': ['priority-medium', 'medium'],
            '低优先级': ['priority-low', 'low']
        }
        return priority_map.get(priority, ['priority-medium'])
        
    def _get_status_labels(self, status: str) -> List[str]:
        """根据状态返回标签"""
        status_map = {
            '已完成': ['status-done', 'completed'],
            '进行中': ['status-in-progress', 'in-progress'],
            '暂停/待定': ['status-paused', 'paused'],
            '未开始': ['status-pending', 'pending']
        }
        return status_map.get(status, ['status-pending'])
        
    def _format_task_body(self, task: Dict[str, Any]) -> str:
        """格式化任务内容为Issue正文"""
        body = f"## 任务描述\n\n{task.get('description', '无描述')}\n\n"
        
        if task.get('implementation_logic'):
            body += f"## 实现逻辑\n\n{task['implementation_logic']}\n\n"
            
        if task.get('acceptance_criteria'):
            body += "## 验收标准\n\n"
            for criterion in task['acceptance_criteria']:
                body += f"- [ ] {criterion}\n"
            body += "\n"
            
        if task.get('related_files'):
            body += "## 相关文件\n\n"
            for file_path in task['related_files']:
                body += f"- {file_path}\n"
            body += "\n"
            
        # 添加阶段信息
        body += f"## 阶段\n\n{task.get('phase', '未指定')}\n\n"
        
        # 添加优先级信息
        body += f"## 优先级\n\n{task.get('priority', '中优先级')}\n\n"
        
        # 添加自动创建标识
        body += "<!-- 此Issue由自动化脚本创建 -->\n"
        
        return body
        
    def create_issue(self, task: Dict[str, Any]) -> str:
        """创建单个Issue"""
        # 准备标签
        labels = ["task", "automated"]
        
        # 添加优先级标签
        priority = task.get('priority', '中优先级')
        labels.extend(self._get_priority_labels(priority))
        
        # 添加状态标签
        status = task.get('status', '未开始')
        labels.extend(self._get_status_labels(status))
        
        # 添加阶段标签
        phase = task.get('phase', '')
        if phase:
            labels.append(f"phase-{phase}")
            
        # 确保标签存在
        for label in labels:
            # 标准化标签名（移除特殊字符，转换为小写）
            clean_label = label.lower().replace(' ', '-').replace('/', '-')
            self._create_label_if_not_exists(clean_label)
            
        # 格式化标题
        title = f"[{task.get('phase', '未指定')}] {task.get('title', '未命名任务')}"
        if len(title) > 250:  # GitHub标题限制
            title = title[:247] + "..."
            
        # 格式化内容
        body = self._format_task_body(task)
        
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
            
    def create_issues_from_json(self, json_file: str) -> List[str]:
        """从JSON文件创建Issues"""
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                tasks = json.load(f)
                
            issue_urls = []
            for task in tasks:
                url = self.create_issue(task)
                issue_urls.append(url)
                
            return issue_urls
            
        except FileNotFoundError:
            print(f"错误: 找不到文件 {json_file}")
            return []
        except json.JSONDecodeError:
            print(f"错误: 无法解析JSON文件 {json_file}")
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
        
    # 创建Issue创建器
    creator = GitHubIssueCreator(token, repo_name)
    
    # 从JSON文件创建Issues
    json_file = "tasks.json"
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
        
    urls = creator.create_issues_from_json(json_file)
    
    print(f"\n创建了 {len(urls)} 个Issues:")
    for url in urls:
        print(url)


if __name__ == "__main__":
    main()