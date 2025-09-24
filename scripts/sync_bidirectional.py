#!/usr/bin/env python3
"""
双向同步机制脚本
实现GitHub Issues与文档之间的状态同步
"""

import os
import json
import sys
from github import Github
from typing import List, Dict, Any


class BidirectionalSync:
    def __init__(self, token: str, repo_name: str, docs_path: str = "docs"):
        self.github = Github(token)
        self.repo = self.github.get_repo(repo_name)
        self.docs_path = docs_path
        
    def get_github_issues(self) -> List[Dict[str, Any]]:
        """获取所有GitHub Issues"""
        issues = []
        try:
            # 获取所有状态的Issues
            github_issues = self.repo.get_issues(state='all')
            for issue in github_issues:
                # 提取阶段信息（从标签中）
                phase = None
                for label in issue.labels:
                    if label.name.startswith('phase-'):
                        phase = label.name.replace('phase-', '')
                        break
                        
                issues.append({
                    'id': issue.number,
                    'title': issue.title,
                    'state': issue.state,  # 'open' 或 'closed'
                    'labels': [label.name for label in issue.labels],
                    'phase': phase,
                    'url': issue.html_url
                })
                
            return issues
        except Exception as e:
            print(f"获取GitHub Issues失败: {e}")
            return []
            
    def update_document_status(self, issue: Dict[str, Any]):
        """根据GitHub Issue状态更新文档"""
        if not issue['phase']:
            print(f"警告: Issue #{issue['id']} 没有关联阶段，无法更新文档")
            return
            
        # 查找对应的文档文件
        doc_file = os.path.join(self.docs_path, f"{issue['phase']}.md")
        if not os.path.exists(doc_file):
            print(f"警告: 找不到文档文件 {doc_file}")
            return
            
        try:
            # 读取文档内容
            with open(doc_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # 提取任务标题（去除阶段前缀）
            task_title = issue['title']
            if '] ' in task_title:
                task_title = task_title.split('] ', 1)[1]
                
            # 确定新的状态图标
            status_map = {
                'closed': '✅',
                'open': '☐'
            }
            new_icon = status_map.get(issue['state'], '☐')
            
            # 查找并替换任务状态
            lines = content.split('\n')
            updated = False
            
            for i, line in enumerate(lines):
                # 查找任务行
                if line.strip().startswith(('✅', '🔄', '⏸', '☐')) and task_title in line:
                    # 提取当前状态图标
                    current_icon = line.strip()[0]
                    if current_icon != new_icon:
                        # 更新状态图标
                        lines[i] = line.replace(current_icon, new_icon, 1)
                        updated = True
                        print(f"已更新文档 {doc_file} 中的任务: {task_title}")
                        break
                        
            if updated:
                # 写入更新后的内容
                with open(doc_file, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(lines))
                    
        except Exception as e:
            print(f"更新文档失败 {doc_file}: {e}")
            
    def sync_issues_to_documents(self):
        """同步所有Issues状态到文档"""
        issues = self.get_github_issues()
        updated_count = 0
        
        for issue in issues:
            # 只同步已关闭的Issues（已完成的任务）
            if issue['state'] == 'closed':
                self.update_document_status(issue)
                updated_count += 1
                
        print(f"已同步 {updated_count} 个Issues到文档")
        
    def update_issue_from_document(self, doc_file: str):
        """根据文档更新GitHub Issue"""
        try:
            with open(doc_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            phase_name = os.path.basename(doc_file).replace('.md', '')
            
            # 解析文档中的任务
            for i, line in enumerate(lines):
                task_match = None
                for icon in ['✅', '🔄', '⏸', '☐']:
                    if line.strip().startswith(icon):
                        task_match = (icon, line.strip()[2:])
                        break
                        
                if not task_match:
                    continue
                    
                status_icon, task_title = task_match
                
                # 确定GitHub状态
                github_state = 'open'
                if status_icon == '✅':
                    github_state = 'closed'
                    
                # 查找对应的GitHub Issue
                issue = self.find_issue_by_title(phase_name, task_title)
                if issue and issue.state != github_state:
                    # 更新Issue状态
                    if github_state == 'closed':
                        issue.edit(state='closed')
                        print(f"已关闭Issue: {task_title}")
                    else:
                        issue.edit(state='open')
                        print(f"已重新打开Issue: {task_title}")
                        
        except Exception as e:
            print(f"从文档更新Issue失败 {doc_file}: {e}")
            
    def find_issue_by_title(self, phase: str, title: str) -> Any:
        """根据标题查找Issue"""
        try:
            # 构造完整的Issue标题
            full_title = f"[{phase}] {title}"
            
            # 获取所有Issues并查找匹配的
            issues = self.repo.get_issues(state='all')
            for issue in issues:
                if issue.title == full_title:
                    return issue
                    
            return None
        except Exception as e:
            print(f"查找Issue失败: {e}")
            return None
            
    def sync_documents_to_issues(self):
        """同步所有文档状态到Issues"""
        updated_count = 0
        
        # 遍历所有文档文件
        for filename in os.listdir(self.docs_path):
            if filename.endswith('.md'):
                doc_file = os.path.join(self.docs_path, filename)
                self.update_issue_from_document(doc_file)
                updated_count += 1
                
        print(f"已同步 {updated_count} 个文档到Issues")


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
        
    # 创建同步器
    sync = BidirectionalSync(token, repo_name)
    
    # 根据参数决定同步方向
    if len(sys.argv) > 1:
        direction = sys.argv[1]
        if direction == 'issues-to-docs':
            sync.sync_issues_to_documents()
        elif direction == 'docs-to-issues':
            sync.sync_documents_to_issues()
        else:
            print("用法: python sync_bidirectional.py [issues-to-docs|docs-to-issues]")
            sys.exit(1)
    else:
        # 默认双向同步
        sync.sync_issues_to_documents()
        sync.sync_documents_to_issues()


if __name__ == "__main__":
    main()