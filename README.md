# Authing Docs Factory

## Introduction / 介绍

通过 Github Actions 触发更新，自动生成文档在 `temp/dist` 分支。

回到开发者文档项目执行更新脚本，即可覆盖最新内容。

## Development

- Download `openapi.json` to ROOT directory
- Install dependencies: `yarn`
- Generator Run: `yarn build`

## Notice

在 mac 系统下将生成文档复制到 docs v2 项目时，注意不要覆盖删除了根目录的安装说明（`README.md`）。
