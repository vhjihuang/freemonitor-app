#!/usr/bin/env python3
"""
从 docs/*.md 文件中提取任务信息并更新 project-plan-structured.json
"""

import os
import json
import re
import sys
from typing import List, Dict, Any


def extract_tasks_from_md(file_path: str, phase_name: str) -> List[Dict[str, Any]]:
    """从Markdown文件中提取任务信息"""
    tasks = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"警告: 找不到文件 {file_path}")
        return tasks
    except Exception as e:
        print(f"错误: 无法读取文件 {file_path} - {e}")
        return tasks
    
    # 使用正则表达式匹配任务块
    # 匹配任务标题和状态
    task_pattern = r'###\s*(.*?)\s*@?(?:done\((.*?)\))?\n\n([\s\S]*?)\n(?=\n###|\Z)'
    task_blocks = re.finditer(task_pattern, content, re.DOTALL)
    
    for match in task_blocks:
        title = match.group(1).strip()
        completion_date = match.group(2)
        task_content = match.group(3).strip()
        
        # 提取状态
        status = "☐ 未开始"  # 默认状态
        status_pattern = r'\*\*状态\*\*:\s*(.*?)(?=\n|$)'
        status_match = re.search(status_pattern, task_content)
        if status_match:
            status = status_match.group(1).strip()
        
        # 如果标题中有状态符号，也提取出来
        if '@done' in title:
            title = title.split('@done')[0].strip()
        
        task = {
            'title': title,
            'status': status
        }
        
        if completion_date:
            task['completionDate'] = completion_date
            
        tasks.append(task)
    
    # 处理没有"状态"字段但有符号的任务
    simple_pattern = r'###\s*([✅🔄⏸☐])\s*(.*?)\s*@?(?:done\((.*?)\))?'
    simple_matches = re.finditer(simple_pattern, content)
    
    for match in simple_matches:
        status_symbol = match.group(1)
        title = match.group(2).strip()
        completion_date = match.group(3)
        
        # 检查是否已经添加了这个任务
        existing = any(task['title'] == title for task in tasks)
        if not existing:
            status_map = {
                '✅': '✅ 已完成',
                '🔄': '🔄 进行中',
                '⏸': '⏸ 暂停/待定',
                '☐': '☐ 未开始'
            }
            
            task = {
                'title': title,
                'status': status_map.get(status_symbol, '☐ 未开始')
            }
            
            if completion_date:
                task['completionDate'] = completion_date
                
            tasks.append(task)
    
    return tasks


def update_project_plan_from_docs(docs_dir: str, json_file: str):
    """从docs目录中的Markdown文件更新project-plan-structured.json"""
    # 读取现有的project-plan-structured.json
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            project_data = json.load(f)
    except FileNotFoundError:
        print(f"错误: 找不到文件 {json_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"错误: 无法解析JSON文件 {json_file} - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"错误: 读取文件 {json_file} 失败 - {e}")
        sys.exit(1)
    
    # 定义阶段文件映射
    phase_files = {
        "阶段一：认证系统完善": "02-phase-1-auth-system.md",
        "阶段二：核心监控功能": "03-phase-2-core-monitoring.md",
        "阶段三：数据展示与处理": "04-phase-3-data-processing.md",
        "阶段四：用户体验优化": "05-phase-4-ux-optimization.md",
        "阶段五：API 与数据流": "06-phase-5-api-dataflow.md",
        "阶段六：后端服务完善": "07-phase-6-backend-enhancement.md",
        "阶段七：安全增强": "08-phase-7-security.md",
        "阶段八：测试与质量": "09-phase-8-testing.md",
        "阶段九：部署与运维": "10-phase-9-deployment.md"
    }
    
    # 更新phaseDetails
    updated_count = 0
    for phase_detail in project_data.get('phaseDetails', []):
        phase = phase_detail.get('phase', '')
        if phase in phase_files:
            md_file_path = os.path.join(docs_dir, phase_files[phase])
            if os.path.exists(md_file_path):
                tasks = extract_tasks_from_md(md_file_path, phase)
                phase_detail['tasks'] = tasks
                print(f"已更新 {phase} 的任务信息，共 {len(tasks)} 个任务")
                updated_count += len(tasks)
            else:
                print(f"警告: 找不到文件 {md_file_path}")
    
    # 写回更新后的数据
    try:
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, ensure_ascii=False, indent=2)
        print(f"已更新 {json_file}，总共更新了 {updated_count} 个任务")
    except Exception as e:
        print(f"错误: 无法写入文件 {json_file} - {e}")
        sys.exit(1)


def main():
    # 获取当前工作目录
    current_dir = os.getcwd()
    docs_dir = os.path.join(current_dir, "docs")
    json_file = os.path.join(current_dir, "docs", "project-plan-structured.json")
    
    print(f"当前工作目录: {current_dir}")
    print(f"Docs目录: {docs_dir}")
    print(f"JSON文件: {json_file}")
    
    if not os.path.exists(docs_dir):
        print(f"错误: 找不到目录 {docs_dir}")
        sys.exit(1)
    
    if not os.path.exists(json_file):
        print(f"错误: 找不到文件 {json_file}")
        sys.exit(1)
    
    update_project_plan_from_docs(docs_dir, json_file)


if __name__ == "__main__":
    main()