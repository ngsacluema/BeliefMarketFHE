# ⚡ 快速开始指南

## 🎯 5 分钟完成部署

### 步骤 1: 安装依赖 (1 分钟)

```bash
cd /Users/songsu/Desktop/zama/fhe-projects-collection/LendingHub

# 安装 Hardhat 依赖
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv ethers
```

### 步骤 2: 配置环境 (1 分钟)

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件
nano .env
```

**填写以下内容：**
```env
PRIVATE_KEY=你的MetaMask私钥_不要加0x前缀
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

**获取私钥：** MetaMask -> 账户菜单 -> 账户详情 -> 显示私钥

### 步骤 3: 获取测试币 (1 分钟)

访问：https://sepoliafaucet.com/
- 输入你的钱包地址
- 点击 "Send Me Test Ether"
- 等待到账（约 30 秒）

### 步骤 4: 部署合约 (1 分钟)

```bash
# 编译合约
npm run compile

# 部署到 Sepolia
npm run deploy
```

**记下输出的合约地址！** 例如：`0xAbC123...XyZ789`

### 步骤 5: 更新前端 (1 分钟)

编辑 `src/config/contracts.ts`:

```typescript
// 替换这行
export const BELIEF_MARKET_ADDRESS = '0x粘贴你的合约地址' as const;
```

---

## 🎉 完成！启动测试

```bash
# 启动前端
npm run dev

# 在浏览器打开: http://localhost:5173
```

---

## 🧪 可选：创建测试市场

```bash
npm run create-markets
```

这会创建 3 个示例预测市场供测试。

---

## 📝 命令速查

| 命令 | 说明 |
|------|------|
| `npm run compile` | 编译合约 |
| `npm run deploy` | 部署合约 |
| `npm run verify` | 验证部署 |
| `npm run create-markets` | 创建测试市场 |
| `npm run dev` | 启动前端 |

---

## ❓ 遇到问题？

查看完整文档：[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
