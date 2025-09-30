#!/bin/bash
# 自动同步脚本 - 每天自动运行

cd /Users/huanghaojie/code/freemonitor-app

# 运行同步脚本
python scripts/sync_tasks_from_docs.py

# 记录同步时间
echo "自动同步完成于: $(date)" >> scripts/sync.log