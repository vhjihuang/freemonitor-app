#!/usr/bin/env python3
"""
测试集成方案脚本
验证GitHub Project + Issue集成是否正常工作
"""

import os
import subprocess
import sys


def test_script_execution():
    """测试脚本是否能正常执行"""
    print("=== 测试脚本执行 ===")
    
    # 测试任务解析脚本
    print("1. 测试任务解析脚本...")
    try:
        result = subprocess.run([
            'python', 'scripts/parse_tasks.py'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("  ✓ 任务解析脚本执行成功")
            if os.path.exists('tasks.json'):
                print("  ✓ 任务JSON文件已生成")
            else:
                print("  ✗ 未生成任务JSON文件")
        else:
            print(f"  ✗ 任务解析脚本执行失败: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("  ✗ 任务解析脚本执行超时")
    except Exception as e:
        print(f"  ✗ 任务解析脚本执行异常: {e}")
        
    # 测试GitHub Issue创建脚本
    print("2. 测试GitHub Issue创建脚本...")
    try:
        # 只测试脚本是否能正常导入和初始化，不实际创建Issues
        result = subprocess.run([
            'python', '-c', 
            'import sys; sys.path.append("scripts"); from create_github_issues import GitHubIssueCreator; print("✓ GitHub Issue创建脚本导入成功")'
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print(f"  {result.stdout.strip()}")
        else:
            print(f"  ✗ GitHub Issue创建脚本导入失败: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("  ✗ GitHub Issue创建脚本导入超时")
    except Exception as e:
        print(f"  ✗ GitHub Issue创建脚本导入异常: {e}")


def test_github_integration():
    """测试GitHub集成"""
    print("\n=== 测试GitHub集成 ===")
    
    # 检查环境变量
    print("1. 检查环境变量...")
    github_token = os.environ.get('GITHUB_TOKEN')
    github_repo = os.environ.get('GITHUB_REPOSITORY')
    
    if github_token:
        print("  ✓ GITHUB_TOKEN 环境变量已设置")
    else:
        print("  ⚠ GITHUB_TOKEN 环境变量未设置（测试时可忽略）")
        
    if github_repo:
        print("  ✓ GITHUB_REPOSITORY 环境变量已设置")
    else:
        print("  ⚠ GITHUB_REPOSITORY 环境变量未设置（测试时可忽略）")
        
    # 检查GitHub CLI
    print("2. 检查GitHub CLI...")
    try:
        result = subprocess.run(['gh', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("  ✓ GitHub CLI 已安装")
        else:
            print("  ✗ GitHub CLI 未安装或配置不正确")
    except FileNotFoundError:
        print("  ✗ GitHub CLI 未安装")
    except Exception as e:
        print(f"  ✗ GitHub CLI 检查异常: {e}")


def test_workflow_files():
    """测试工作流文件"""
    print("\n=== 测试工作流文件 ===")
    
    # 检查目录结构
    required_paths = [
        '.github/ISSUE_TEMPLATE',
        '.github/workflows',
        'scripts'
    ]
    
    for path in required_paths:
        if os.path.exists(path):
            print(f"  ✓ {path} 目录存在")
        else:
            print(f"  ✗ {path} 目录不存在")
            
    # 检查必需的文件
    required_files = [
        '.github/ISSUE_TEMPLATE/task-template.md',
        '.github/ISSUE_TEMPLATE/bug-template.md',
        '.github/ISSUE_TEMPLATE/feature-template.md',
        '.github/workflows/sync-tasks.yml',
        'scripts/parse_tasks.py',
        'scripts/create_github_issues.py',
        'scripts/sync_bidirectional.py'
    ]
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"  ✓ {file_path} 文件存在")
        else:
            print(f"  ✗ {file_path} 文件不存在")


def main():
    """主测试函数"""
    print("GitHub Project + Issue 集成方案测试")
    print("=" * 50)
    
    test_workflow_files()
    test_script_execution()
    test_github_integration()
    
    print("\n" + "=" * 50)
    print("测试完成。请检查以上结果确认集成方案是否正确配置。")
    print("\n下一步建议:")
    print("1. 如果所有测试通过，可以手动运行脚本进行实际测试")
    print("2. 配置GitHub仓库的Secrets以启用自动化工作流")
    print("3. 在GitHub上创建Project Board以管理Issues")


if __name__ == "__main__":
    main()