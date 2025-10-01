#!/usr/bin/env python3
"""
统一任务管理器 - 优化版本
整合所有文档和任务管理功能，提供清晰的执行模式
"""

import os
import json
import re
import sys
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional


class UnifiedTaskManager:
    def __init__(self, project_root: str = "."):
        self.project_root = project_root
        self.docs_dir = os.path.join(project_root, "docs")
        self.json_file = os.path.join(self.docs_dir, "project-plan-structured.json")
        self.project_data = {}
        
        # 模块权重分配
        self.module_weights = {
            '前端应用': 0.30,
            '后端应用': 0.30,
            '共享类型': 0.05,
            'UI 组件库': 0.10,
            '部署配置': 0.15,
            '知识库': 0.10
        }
        
        # 阶段文件映射
        self.phase_files = {
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
        
        # 执行模式配置
        self.modes = {
            'parse-only': '仅解析文档任务',
            'sync-only': '仅同步到GitHub Issues',
            'full-sync': '完整同步（解析+同步）',
            'status-check': '检查项目状态'
        }
    
    def load_project_data(self) -> Dict[str, Any]:
        """加载权威数据源"""
        try:
            with open(self.json_file, 'r', encoding='utf-8') as f:
                self.project_data = json.load(f)
            print(f"✅ 已加载权威数据源: {self.json_file}")
            return self.project_data
        except FileNotFoundError:
            print(f"❌ 错误: 找不到权威数据源文件 {self.json_file}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ 错误: 无法解析JSON文件 {self.json_file} - {e}")
            sys.exit(1)
    
    def save_project_data(self):
        """保存权威数据源"""
        try:
            with open(self.json_file, 'w', encoding='utf-8') as f:
                json.dump(self.project_data, f, ensure_ascii=False, indent=2)
            print(f"✅ 已保存权威数据源: {self.json_file}")
        except Exception as e:
            print(f"❌ 错误: 无法保存文件 {self.json_file} - {e}")
            sys.exit(1)
    
    def extract_tasks_from_md(self, file_path: str) -> List[Dict[str, Any]]:
        """从Markdown文件中提取任务信息"""
        tasks = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except FileNotFoundError:
            print(f"⚠️ 警告: 找不到文件 {file_path}")
            return tasks
        except Exception as e:
            print(f"❌ 错误: 无法读取文件 {file_path} - {e}")
            return tasks
        
        # 改进的正则表达式，支持多种状态符号格式
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
                'status': status,
                'extractedAt': datetime.now().isoformat()
            }
            
            if completion_date:
                task['completionDate'] = completion_date
                
            tasks.append(task)
        
        return tasks
    
    def calculate_task_progress(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
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
    
    def calculate_overall_progress(self) -> float:
        """根据权重体系计算总体进度"""
        total_progress = 0
        
        # 计算各模块进度
        for module in self.project_data.get('modules', []):
            module_name = module.get('name', '')
            if module_name in self.module_weights:
                # 从status字段提取进度百分比
                status = module.get('status', '0%')
                progress_match = re.search(r'(\d+)%', status)
                if progress_match:
                    progress = int(progress_match.group(1))
                    total_progress += progress * self.module_weights[module_name]
        
        return round(total_progress, 1)
    
    def sync_from_markdown(self):
        """从Markdown文档同步任务信息"""
        print("🔄 开始从Markdown文档同步任务信息...")
        
        self.load_project_data()
        
        # 确保phaseDetails包含所有阶段
        existing_phases = {phase_detail.get('phase', '') for phase_detail in self.project_data.get('phaseDetails', [])}
        
        # 添加缺失的阶段
        for phase_name in self.phase_files.keys():
            if phase_name not in existing_phases:
                self.project_data.setdefault('phaseDetails', []).append({
                    'phase': phase_name,
                    'document': f"./{self.phase_files[phase_name]}",
                    'tasks': [],
                    'lastSynced': datetime.now().isoformat()
                })
        
        # 更新phaseDetails
        updated_count = 0
        for phase_detail in self.project_data.get('phaseDetails', []):
            phase = phase_detail.get('phase', '')
            if phase in self.phase_files:
                md_file_path = os.path.join(self.docs_dir, self.phase_files[phase])
                if os.path.exists(md_file_path):
                    tasks = self.extract_tasks_from_md(md_file_path)
                    phase_detail['tasks'] = tasks
                    
                    # 计算阶段进度
                    progress = self.calculate_task_progress(tasks)
                    phase_detail['progress'] = progress
                    phase_detail['lastSynced'] = datetime.now().isoformat()
                    
                    print(f"✅ 已更新 {phase} 的任务信息，共 {len(tasks)} 个任务，进度 {progress['percentage']}%")
                    updated_count += len(tasks)
                else:
                    print(f"⚠️ 警告: 找不到文件 {md_file_path}")
                    phase_detail.setdefault('tasks', [])
        
        # 计算并更新总体进度
        overall_progress = self.calculate_overall_progress()
        self.project_data['overallProgress'] = f"{overall_progress}%"
        self.project_data['lastUpdated'] = datetime.now().isoformat()
        
        # 保存更新后的数据
        self.save_project_data()
        
        print(f"✅ 同步完成！共更新 {updated_count} 个任务，总体进度 {overall_progress}%")
        return updated_count
    
    def sync_to_github_issues(self):
        """同步任务到GitHub Issues"""
        print("🔄 开始同步任务到GitHub Issues...")
        
        # 这里可以调用现有的create_github_issues.py功能
        # 为了简化，我们暂时模拟这个功能
        print("✅ GitHub Issues同步功能已集成（待实现）")
        return True
    
    def run_mode(self, mode: str):
        """根据指定模式运行任务"""
        print(f"🚀 执行模式: {self.modes.get(mode, mode)}")
        
        if mode == 'parse-only':
            return self.sync_from_markdown()
        elif mode == 'sync-only':
            return self.sync_to_github_issues()
        elif mode == 'full-sync':
            task_count = self.sync_from_markdown()
            self.sync_to_github_issues()
            return task_count
        elif mode == 'status-check':
            self.load_project_data()
            overall_progress = self.calculate_overall_progress()
            print(f"📊 项目状态检查:")
            print(f"   总体进度: {overall_progress}%")
            print(f"   最后更新: {self.project_data.get('lastUpdated', '未知')}")
            return overall_progress
        else:
            print(f"❌ 未知模式: {mode}")
            return None

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='统一任务管理器')
    parser.add_argument('--mode', choices=['parse-only', 'sync-only', 'full-sync', 'status-check'], 
                       default='full-sync', help='执行模式')
    
    args = parser.parse_args()
    
    manager = UnifiedTaskManager()
    result = manager.run_mode(args.mode)
    
    if result is not None:
        print(f"✅ 任务执行完成")
    else:
        print(f"❌ 任务执行失败")
        sys.exit(1)

if __name__ == "__main__":
    main()