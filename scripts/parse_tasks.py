#!/usr/bin/env python3
"""
文档任务解析脚本
用于解析docs目录下的Markdown文档，提取任务信息
"""

import os
import re
import json
from typing import List, Dict, Any


class TaskParser:
    def __init__(self, docs_path: str = "docs"):
        self.docs_path = docs_path
        self.tasks = []
        
    def parse_document(self, file_path: str) -> List[Dict[str, Any]]:
        """解析单个文档文件，提取任务信息"""
        tasks = []
        current_phase = ""
        current_section = ""
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # 提取文件名作为阶段名
        phase_name = os.path.basename(file_path).replace('.md', '')
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # 检测阶段标题
            if line.startswith('# '):
                current_phase = line[2:].strip()
                i += 1
                continue
                
            # 检测任务项 (以✅, 🔄, ⏸, ☐ 开头)
            task_match = re.match(r'^([✅🔄⏸☐])\s+(.+)', line)
            if task_match:
                status_icon = task_match.group(1)
                task_title = task_match.group(2)
                
                # 转换状态图标为文字状态
                status_map = {
                    '✅': '已完成',
                    '🔄': '进行中',
                    '⏸': '暂停/待定',
                    '☐': '未开始'
                }
                status = status_map.get(status_icon, '未开始')
                
                task = {
                    'title': task_title,
                    'status': status,
                    'phase': phase_name,
                    'description': '',
                    'acceptance_criteria': [],
                    'related_files': [],
                    'implementation_logic': '',
                    'priority': self._determine_priority(file_path),
                    'dependencies': []
                }
                
                # 解析任务详情
                i = self._parse_task_details(lines, i + 1, task)
                tasks.append(task)
            else:
                i += 1
                
        return tasks
    
    def _parse_task_details(self, lines: List[str], start_index: int, task: Dict[str, Any]) -> int:
        """解析任务详情"""
        i = start_index
        in_acceptance_criteria = False
        in_related_files = False
        
        while i < len(lines):
            line = lines[i].strip()
            
            # 如果遇到新的任务项或文件结束，停止解析
            if re.match(r'^[✅🔄⏸☐]\s+.+', line) or line.startswith('# '):
                break
                
            # 解析状态
            if line.startswith('**状态**:'):
                task['status'] = line.replace('**状态**:', '').strip()
                
            # 解析描述
            elif line.startswith('**描述**:'):
                task['description'] = line.replace('**描述**:', '').strip()
                
            # 解析实现逻辑
            elif line.startswith('**实现逻辑**:'):
                task['implementation_logic'] = line.replace('**实现逻辑**:', '').strip()
                
            # 解析相关文件
            elif line.startswith('**相关文件**:'):
                in_related_files = True
                task['related_files'] = []
                
            # 解析验收标准
            elif line.startswith('**验收标准**:'):
                in_acceptance_criteria = True
                task['acceptance_criteria'] = []
                
            # 收集相关文件
            elif in_related_files and line.startswith('- '):
                file_path = line[2:].strip()
                task['related_files'].append(file_path)
                
            # 收集验收标准
            elif in_acceptance_criteria and line.startswith('- '):
                criterion = line[2:].strip()
                task['acceptance_criteria'].append(criterion)
                
            # 停止收集相关文件和验收标准
            elif in_related_files and not line.startswith('- ') and not line.startswith('**'):
                in_related_files = False
                
            elif in_acceptance_criteria and not line.startswith('- ') and not line.startswith('**'):
                in_acceptance_criteria = False
                
            i += 1
            
        return i
    
    def _determine_priority(self, file_path: str) -> str:
        """根据文件名确定任务优先级"""
        priority_map = {
            '02-phase-1-auth-system.md': '高优先级',
            '03-phase-2-core-monitoring.md': '高优先级',
            '04-phase-3-data-processing.md': '中优先级',
            '05-phase-4-ux-optimization.md': '中优先级',
            '06-phase-5-api-dataflow.md': '低优先级',
            '07-phase-6-backend-enhancement.md': '低优先级',
            '08-phase-7-security.md': '高优先级',
            '09-phase-8-testing.md': '中优先级',
            '10-phase-9-deployment.md': '低优先级'
        }
        
        filename = os.path.basename(file_path)
        return priority_map.get(filename, '中优先级')
    
    def parse_all_documents(self) -> List[Dict[str, Any]]:
        """解析所有文档文件"""
        all_tasks = []
        
        for filename in os.listdir(self.docs_path):
            if filename.endswith('.md'):
                file_path = os.path.join(self.docs_path, filename)
                tasks = self.parse_document(file_path)
                all_tasks.extend(tasks)
                
        return all_tasks
    
    def save_tasks_to_json(self, tasks: List[Dict[str, Any]], output_file: str = "tasks.json"):
        """将任务保存为JSON文件"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(tasks, f, ensure_ascii=False, indent=2)


def main():
    parser = TaskParser()
    tasks = parser.parse_all_documents()
    parser.save_tasks_to_json(tasks)
    print(f"已解析 {len(tasks)} 个任务并保存到 tasks.json")


if __name__ == "__main__":
    main()