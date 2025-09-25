#!/usr/bin/env python3
"""
文档任务解析脚本
用于解析docs目录下的Markdown文档，提取任务信息并更新 project-plan-structured.json
"""

import os
import re
import json
from typing import List, Dict, Any


class TaskParser:
    def __init__(self, docs_path: str = "docs", json_file: str = "docs/project-plan-structured.json"):
        self.docs_path = docs_path
        self.json_file = json_file
        self.project_data = {}
        
    def load_project_data(self):
        """加载现有的project-plan-structured.json文件"""
        try:
            with open(self.json_file, 'r', encoding='utf-8') as f:
                self.project_data = json.load(f)
        except FileNotFoundError:
            print(f"错误: 找不到文件 {self.json_file}")
            raise
        except json.JSONDecodeError as e:
            print(f"错误: 无法解析JSON文件 {self.json_file} - {e}")
            raise
            
    def extract_tasks_from_md(self, file_path: str) -> List[Dict[str, Any]]:
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
    
    def update_project_plan_from_docs(self):
        """从docs目录中的Markdown文件更新project-plan-structured.json"""
        # 加载现有的project数据
        self.load_project_data()
        
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
        
        # 确保phaseDetails包含所有阶段
        existing_phases = {phase_detail.get('phase', '') for phase_detail in self.project_data.get('phaseDetails', [])}
        
        # 添加缺失的阶段
        for phase_name in phase_files.keys():
            if phase_name not in existing_phases:
                self.project_data.setdefault('phaseDetails', []).append({
                    'phase': phase_name,
                    'document': f"./{phase_files[phase_name]}",
                    'tasks': []
                })
        
        # 更新phaseDetails
        updated_count = 0
        for phase_detail in self.project_data.get('phaseDetails', []):
            phase = phase_detail.get('phase', '')
            if phase in phase_files:
                md_file_path = os.path.join(self.docs_path, phase_files[phase])
                if os.path.exists(md_file_path):
                    tasks = self.extract_tasks_from_md(md_file_path)
                    phase_detail['tasks'] = tasks
                    print(f"已更新 {phase} 的任务信息，共 {len(tasks)} 个任务")
                    updated_count += len(tasks)
                else:
                    print(f"警告: 找不到文件 {md_file_path}")
                    # 即使文件不存在，也要确保tasks字段存在
                    phase_detail.setdefault('tasks', [])
        
        # 写回更新后的数据
        try:
            with open(self.json_file, 'w', encoding='utf-8') as f:
                json.dump(self.project_data, f, ensure_ascii=False, indent=2)
            print(f"已更新 {self.json_file}，总共更新了 {updated_count} 个任务")
        except Exception as e:
            print(f"错误: 无法写入文件 {self.json_file} - {e}")
            raise
    
    def parse_all_documents(self) -> List[Dict[str, Any]]:
        """解析所有文档文件"""
        # 这个方法现在主要用于兼容性，实际功能已转移到update_project_plan_from_docs
        return []


def main():
    parser = TaskParser()
    parser.update_project_plan_from_docs()
    print("已完成从Markdown文档同步任务信息到 project-plan-structured.json")


if __name__ == "__main__":
    main()