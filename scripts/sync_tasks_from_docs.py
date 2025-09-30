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
    
    # 改进的正则表达式，更好地匹配任务格式
    # 匹配任务标题和状态（支持多种格式）
    task_pattern = r'###\s*([✅🔄⏸☐\[x\]\[~\]\[\s\]]?)\s*(.*?)\s*(?:@done\((.*?)\))?\n\n([\s\S]*?)\n(?=\n###|\Z)'
    task_blocks = re.finditer(task_pattern, content, re.DOTALL)
    
    for match in task_blocks:
        status_symbol = match.group(1).strip()
        title = match.group(2).strip()
        completion_date = match.group(3)
        task_content = match.group(4).strip()
        
        # 优先从内容中提取状态
        status = "☐ 未开始"  # 默认状态
        status_pattern = r'\*\*状态\*\*:\s*(.*?)(?=\n|$)'
        status_match = re.search(status_pattern, task_content)
        if status_match:
            status = status_match.group(1).strip()
        else:
            # 如果内容中没有状态，根据符号判断
            status_map = {
                '✅': '✅ 已完成',
                '[x]': '✅ 已完成',
                '🔄': '🔄 进行中',
                '[~]': '🔄 进行中',
                '⏸': '⏸ 暂停/待定',
                '☐': '☐ 未开始',
                '[ ]': '☐ 未开始',
                '': '☐ 未开始'
            }
            status = status_map.get(status_symbol, '☐ 未开始')
        
        # 清理标题中的状态符号
        title = re.sub(r'^[✅🔄⏸☐\[x\]\[~\]\[\s\]]\s*', '', title).strip()
        
        task = {
            'title': title,
            'status': status
        }
        
        if completion_date:
            task['completionDate'] = completion_date
            
        tasks.append(task)
    
    return tasks


def calculate_progress(tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """计算任务进度"""
    total_tasks = len(tasks)
    if total_tasks == 0:
        return {
            'completed': 0,
            'inProgress': 0,
            'pending': 0,
            'total': 0,
            'percentage': 0
        }
    
    completed = sum(1 for task in tasks if task['status'] == '✅ 已完成')
    in_progress = sum(1 for task in tasks if task['status'] == '🔄 进行中')
    pending = total_tasks - completed - in_progress
    
    # 改进的百分比计算：已完成任务占100%，进行中任务占50%
    percentage = (completed + in_progress * 0.5) / total_tasks * 100
    
    return {
        'completed': completed,
        'inProgress': in_progress,
        'pending': pending,
        'total': total_tasks,
        'percentage': round(percentage, 1)
    }


def calculate_overall_progress(project_data: Dict[str, Any]) -> float:
    """根据权重体系计算总体进度"""
    # 模块权重分配（权威数据源）
    weights = {
        'frontend': 0.30,  # 前端应用
        'backend': 0.30,   # 后端服务
        'sharedTypes': 0.05,  # 共享类型
        'uiLibrary': 0.10,    #  UI组件库
        'deployment': 0.15,   # 部署配置
        'knowledgeBase': 0.10  # 知识库
    }
    
    total_progress = 0
    
    # 计算各模块进度
    for module in project_data.get('modules', []):
        module_name = module.get('name', '')
        if module_name in weights:
            # 从status字段提取进度百分比
            status = module.get('status', '0%')
            progress_match = re.search(r'(\d+)%', status)
            if progress_match:
                progress = int(progress_match.group(1))
                total_progress += progress * weights[module_name]
    
    return round(total_progress, 1)


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
                
                # 计算阶段进度
                progress = calculate_progress(tasks)
                phase_detail['progress'] = progress
                
                print(f"已更新 {phase} 的任务信息，共 {len(tasks)} 个任务，进度 {progress['percentage']}%")
                updated_count += len(tasks)
            else:
                print(f"警告: 找不到文件 {md_file_path}")
    
    # 计算并更新总体进度
    overall_progress = calculate_overall_progress(project_data)
    project_data['overallProgress'] = f"{overall_progress}%"
    
    # 写回更新后的数据
    try:
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, ensure_ascii=False, indent=2)
        print(f"已更新 {json_file}，总共更新了 {updated_count} 个任务，总体进度 {overall_progress}%")
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