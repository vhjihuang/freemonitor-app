#!/usr/bin/env python3
"""
自动更新开发Changelog
从Git提交历史和任务状态生成详细的变更记录
"""

import os
import subprocess
import json
import re
from datetime import datetime

# 获取Git提交历史
def get_git_commits():
    try:
        result = subprocess.run(
            ["git", "log", "--since", "1 month ago", "--pretty=format:%h %an %ad %s", "--date=short"],
            capture_output=True, text=True, check=True
        )
        return result.stdout.split('\n')
    except Exception as e:
        print(f"获取Git提交历史失败: {e}")
        return []

# 读取任务状态
def get_project_status():
    try:
        with open("docs/project-plan-structured.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"读取项目计划失败: {e}")
        return {}

# 获取最近修改的文件（排除changelog文件本身）
def get_recently_modified_files():
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD^..HEAD"],
            capture_output=True, text=True, check=True
        )
        files = result.stdout.strip().split('\n') if result.stdout else []
        # 过滤掉changelog文件本身，避免循环更新
        return [f for f in files if f != "docs/development/changelog.md"]
    except Exception as e:
        print(f"获取最近修改文件失败: {e}")
        return []

# 更新开发Changelog
def update_dev_changelog():
    commits = get_git_commits()
    project_status = get_project_status()
    recently_modified = get_recently_modified_files()
    today = datetime.now().strftime("%Y-%m-%d")
    
    # 读取现有Changelog
    changelog_path = "docs/development/changelog.md"
    if os.path.exists(changelog_path):
        with open(changelog_path, "r", encoding="utf-8") as f:
            content = f.read()
    else:
        content = "# 开发变更日志\n\n由Git提交历史自动生成\n\n最后更新时间: " + today + "\n\n## 变更记录\n\n"
    
    # 添加新的变更记录
    new_entry = f"### {today}\n\n"
    
    # 1. 提交活动
    new_entry += "#### 提交活动\n\n"
    if commits:
        for commit in commits[:20]:  # 限制显示最近20条提交
            new_entry += f"- {commit}\n"
    else:
        new_entry += "- 暂无新提交\n"
    
    # 2. 项目状态更新
    new_entry += "\n#### 项目状态\n\n"
    if project_status:
        new_entry += f"- 整体进度: {project_status.get('overallProgress', '未知')}\n"
        if 'modules' in project_status:
            for module in project_status['modules']:
                new_entry += f"  - {module['name']}: {module['status']}\n"
    
    # 3. 最近修改的重要文件
    if recently_modified:
        new_entry += "\n#### 最近修改的重要文件\n\n"
        # 分类文件
        backend_files = []
        frontend_files = []
        docs_files = []
        other_files = []
        
        for file in recently_modified:
            if file.startswith(('apps/backend/', 'packages/')) and not file.startswith('packages/frontend/'):
                backend_files.append(file)
            elif file.startswith(('apps/frontend/', 'packages/frontend/')):
                frontend_files.append(file)
            elif file.startswith('docs/'):
                docs_files.append(file)
            else:
                other_files.append(file)
        
        if backend_files:
            new_entry += "- **后端相关**:\n"
            for file in backend_files:
                new_entry += f"  - {file}\n"
        
        if frontend_files:
            new_entry += "- **前端相关**:\n"
            for file in frontend_files:
                new_entry += f"  - {file}\n"
        
        if docs_files:
            new_entry += "- **文档相关**:\n"
            for file in docs_files:
                new_entry += f"  - {file}\n"
    
    new_entry += "\n---\n\n"
    
    # 插入到文档开头
    if "## 变更记录\n\n" in content:
        parts = content.split("## 变更记录\n\n")
        content = parts[0] + "## 变更记录\n\n" + new_entry + parts[1]
    else:
        content += new_entry
    
    # 更新最后更新时间
    if re.search(r"最后更新时间: \d{4}-\d{2}-\d{2}", content):
        content = re.sub(r"最后更新时间: \d{4}-\d{2}-\d{2}", f"最后更新时间: {today}", content)
    else:
        # 如果没有最后更新时间，添加到开头
        content = f"# 开发变更日志\n\n由Git提交历史自动生成\n\n最后更新时间: {today}\n\n" + content.lstrip("# 开发变更日志\n\n由Git提交历史自动生成\n\n")
    
    # 写入文件
    with open(changelog_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"已更新开发Changelog: {changelog_path}")

if __name__ == "__main__":
    update_dev_changelog()