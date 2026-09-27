# Magic Resume Docker 部署说明

本文说明如何用 Docker Compose 部署当前版本的 Magic Resume（访问码空间 + 本地打印 PDF / JSON 导出，无 AI）。

## 前置条件

- 已安装 [Docker](https://docs.docker.com/get-docker/) 与 Docker Compose
- 开放宿主机端口 `3000`（可按需改映射）

## 一键构建并启动

在仓库根目录执行：

```bash
docker compose up -d --build
```

浏览器访问：<http://localhost:3000>

停止：

```bash
docker compose down
```

> `down` 不会删除命名卷；数据仍保留。若要连同数据一起删除，使用 `docker compose down -v`（不可恢复）。

## 访问码与数据持久化

- 应用**无登录**。打开页面后输入访问码进入对应空间。
- 示例访问码：`demo1`（满足规则：3–64 位，字母数字开头，允许 `._-`）
- 服务端数据目录：容器内 `/app/data/spaces/<访问码>/`，每个简历一个 JSON 文件
- Compose 使用**命名卷** `magic-resume-data` 挂载到 `/app/data`，容器重建/重启后访问码空间数据仍保留

查看卷：

```bash
docker volume ls | grep magic-resume-data
```

## 端口与环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `PORT` | `3000` | 容器内监听端口 |
| `HOSTNAME` | `0.0.0.0` | 监听地址 |
| `COOKIE_SECURE` | （未设置） | 设为 `1` 时，访问码 Cookie 带 `Secure`（HTTPS 反代时建议开启） |

端口映射在 `docker-compose.yml` 中：`"3000:3000"`。若要改成宿主机 `8080`：

```yaml
ports:
  - "8080:3000"
```

## 拉取更新后重新构建

```bash
git pull origin main
docker compose up -d --build
```

命名卷不会被覆盖，已有访问码空间（如 `demo1`）中的简历会保留。

## 仅构建镜像（可选）

```bash
docker build -t magic-resume:local .
docker run --rm -p 3000:3000 -v magic-resume-data:/app/data magic-resume:local
```

## 常见问题

1. **页面能开但保存失败**  
   确认卷已挂载到 `/app/data`，且容器日志无权限错误。入口脚本会尝试将 `/app/data` 属主改为应用用户。

2. **改了代码不生效**  
   需重新 `--build`；仅 `restart` 不会带上新构建产物。

3. **HTTPS**  
   在反代后设置 `COOKIE_SECURE=1`，否则部分浏览器可能不持久化 Cookie。
