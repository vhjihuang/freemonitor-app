#!/usr/bin/env python3
"""
文档同步主控制脚本
整合现有同步功能，提供统一入口
"""

import os
import sys
import argparse
import subprocess
from typing import Optional

# 执行子脚本
def run_script(script_path: str, env_vars: dict = None) -> bool:
    try:
        if env_vars:
            current_env = os.environ.copy()
            current_env.update(env_vars)
            env = current_env
        else:
            env = os.environ
        
        print(f"正在执行脚本: {script_path}")
        result = subprocess.run([sys.executable, script_path], env=env, check=False, capture_output=True, text=True)
        
        # 打印输出结果
        if result.stdout:
            print(f"脚本输出:\n{result.stdout}")
        if result.stderr:
            print(f"脚本错误输出:\n{result.stderr}")
            
        return result.returncode == 0
    except Exception as e:
        print(f"执行脚本 {script_path} 失败: {e}")
        return False

# 主函数
def main(mode: str, token: Optional[str] = None):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 设置环境变量
    env = {
        "PYTHONPATH": base_dir
    }
    
    if token:
        env["GITHUB_TOKEN"] = token
        env["GITHUB_REPOSITORY"] = os.environ.get("GITHUB_REPOSITORY", "your-username/your-repo")
    
    # 根据模式执行不同的同步任务
    if mode == "full":
        # 全量同步：解析任务 -> 创建Issues -> 更新Changelog
        print("开始全量文档同步...")
        success = True
        
        # 解析任务
        if not run_script(os.path.join(base_dir, "scripts", "parse_tasks.py"), env):
            print("警告：任务解析失败，继续执行下一步")
            success = False
        
        # 创建GitHub Issues
        if "GITHUB_TOKEN" in env and not run_script(os.path.join(base_dir, "scripts", "create_github_issues.py"), env):
            print("警告：GitHub Issues创建失败，继续执行下一步")
            success = False
        elif "GITHUB_TOKEN" not in env:
            print("跳过GitHub Issues创建：未提供GITHUB_TOKEN")
        
        # 更新Changelog
        if not run_script(os.path.join(base_dir, "scripts", "update_dev_changelog.py"), env):
            print("警告：Changelog更新失败")
            success = False
        
        print("全量文档同步完成" + ("（部分任务失败）" if not success else ""))
        
    elif mode == "tasks":
        # 仅同步任务
        print("同步任务信息...")
        success = True
        
        if not run_script(os.path.join(base_dir, "scripts", "parse_tasks.py"), env):
            print("警告：任务解析失败，继续执行下一步")
            success = False
        
        if not run_script(os.path.join(base_dir, "scripts", "sync_tasks_from_docs.py"), env):
            print("警告：任务同步失败")
            success = False
        
        print("任务同步完成" + ("（部分任务失败）" if not success else ""))
        
    elif mode == "changelog":
        # 仅更新Changelog
        print("更新Changelog...")
        if not run_script(os.path.join(base_dir, "scripts", "update_dev_changelog.py"), env):
            print("警告：Changelog更新失败")
        else:
            print("Changelog更新完成")
            
    elif mode == "bidirectional":
        # 双向同步（GitHub Issues <-> 文档）
        print("执行双向同步...")
        if "GITHUB_TOKEN" not in env:
            print("错误：执行双向同步需要提供GITHUB_TOKEN")
            sys.exit(1)
            
        if not run_script(os.path.join(base_dir, "scripts", "sync_bidirectional.py"), env):
            print("警告：双向同步失败")
        else:
            print("双向同步完成")
    
    else:
        print(f"未知模式: {mode}")
        print("可用模式: full, tasks, changelog, bidirectional")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="文档同步主控制脚本")
    parser.add_argument("mode", choices=["full", "tasks", "changelog", "bidirectional"], help="同步模式")
    parser.add_argument("--token", help="GitHub令牌")
    args = parser.parse_args()
    main(args.mode, args.token)