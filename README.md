# 🔐 BeliefMarketFHE - Privacy-Preserving Prediction Markets

基于 Zama FHE 技术的隐私保护预测市场平台

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-green.svg)
![FHE](https://img.shields.io/badge/FHE-Zama%200.2.0-purple.svg)
![Network](https://img.shields.io/badge/Network-Sepolia-orange.svg)

---

## ✨ 特性

- 🔐 **完全加密投票** - 使用 FHE 技术加密投票权重，链上无法查看
- 🧮 **同态运算** - 直接对加密数据进行累加计算
- 🔓 **官方解密** - 通过 Zama Gateway 异步解密结果
- 💰 **公平奖励** - 自动按比例分配奖池给获胜方
- 🎯 **二元市场** - 简单的 YES/NO 预测市场
- ⚡ **即时反馈** - 实时交易状态和用户提示

---

## 🏗️ 技术架构

### 智能合约
- **语言**: Solidity 0.8.24
- **FHE 库**: @fhevm/solidity (Zama)
- **加密类型**: euint64（64位加密整数）
- **网络**: Ethereum Sepolia Testnet

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **UI 组件**: shadcn/ui + Radix UI
- **Web3**: Wagmi 2.19 + Viem 2.38
- **FHE SDK**: Zama Relayer SDK 0.2.0 (CDN)
- **样式**: TailwindCSS

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- npm 或 yarn
- MetaMask 钱包
- Sepolia 测试币（0.1 ETH）

### 安装

```bash
# 克隆仓库
git clone <repository-url>
cd LendingHub

# 安装前端依赖
npm install

# 安装 Hardhat 依赖
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv ethers
```

### 配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
nano .env
```

填写以下内容：
```env
PRIVATE_KEY=your_metamask_private_key
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

### 部署

```bash
# 编译合约
npm run compile

# 部署到 Sepolia
npm run deploy

# 验证部署
npm run verify

# 创建测试市场（可选）
npm run create-markets
```

### 启动

```bash
# 启动开发服务器
npm run dev

# 打开浏览器访问
http://localhost:5173
```

---

## 📚 文档

- **[🚀 快速开始](./QUICK_START.md)** - 5 分钟完成部署
- **[📖 完整部署指南](./DEPLOYMENT_GUIDE.md)** - 详细步骤和故障排查
- **[📦 部署资源包](./DEPLOYMENT_README.md)** - 所有文件和清单
- **[🔧 技术集成文档](./INTEGRATION_COMPLETE.md)** - 代码架构说明

---

## 🎮 使用流程

### 1️⃣ 创建市场

1. 连接钱包
2. 导航到 "Create Market"
3. 填写市场信息：
   - 市场问题（例如："Will ETH reach $5,000?"）
   - 描述和解决标准
   - 投票质押金额（最低 0.005 ETH）
   - 截止时间
4. 支付平台质押费（0.02 ETH）
5. 确认交易

### 2️⃣ 投票

1. 浏览 "Markets" 部分
2. 点击市场卡片查看详情
3. 选择 YES 或 NO
4. 等待 FHE 加密（约 5-10 秒）
5. 支付投票质押费
6. 确认交易

### 3️⃣ 解密（创建者）

1. 等待市场到期
2. 点击 "Request Decryption"
3. 等待 Gateway 回调（2-5 分钟）
4. 刷新页面查看结果

### 4️⃣ 领奖

1. 检查自己是否获胜
2. 点击 "Claim Prize"
3. 确认交易
4. 获得按比例分配的奖池

---

## 🔐 FHE 工作原理

```
用户投票
    ↓
前端 FHE 加密 (encryptUint64)
    ↓
生成加密句柄 + 证明
    ↓
提交到智能合约
    ↓
合约同态累加 (FHE.add)
    ↓
市场到期
    ↓
请求解密 (FHE.requestDecryption)
    ↓
Gateway 异步解密
    ↓
回调合约 (resolveTallyCallback)
    ↓
保存明文结果
    ↓
用户领奖
```

---

## 📦 项目结构

```
LendingHub/
├── contracts/
│   └── LendingHub.sol              # BeliefMarketFHE 合约
├── scripts/
│   ├── deploy.js                   # 部署脚本
│   ├── verify-deployment.js        # 验证脚本
│   └── create-test-markets.js      # 创建测试市场
├── src/
│   ├── lib/
│   │   └── fhe.ts                  # FHE 加密库
│   ├── config/
│   │   └── contracts.ts            # 合约配置
│   ├── hooks/
│   │   └── useBeliefMarket.ts      # React Hooks
│   └── components/
│       ├── CreateMarket.tsx        # 创建市场
│       ├── VoteModal.tsx           # 投票弹窗
│       ├── MarketDetailModal.tsx   # 市场详情
│       └── MarketCard.tsx          # 市场卡片
├── deployments/                    # 部署记录（Git 忽略）
├── .env.example                    # 环境变量模板
├── hardhat.config.js               # Hardhat 配置
└── package.json                    # 依赖和脚本
```

---

## 🔧 npm 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run compile` | 编译智能合约 |
| `npm run deploy` | 部署合约到 Sepolia |
| `npm run verify` | 验证部署状态 |
| `npm run create-markets` | 创建测试市场 |

---

## 🧪 测试

### 功能测试清单

- [ ] 创建市场成功
- [ ] FHE 加密投票成功
- [ ] 投票权重验证正确
- [ ] 市场到期检测正常
- [ ] 解密请求成功
- [ ] Gateway 回调执行
- [ ] 领奖功能正常
- [ ] 平局退款正常

### 测试网信息

- **网络**: Ethereum Sepolia
- **Chain ID**: 11155111
- **浏览器**: https://sepolia.etherscan.io/
- **水龙头**: https://sepoliafaucet.com/

---

## 📊 合约参数

| 参数 | 值 | 说明 |
|------|-----|------|
| Platform Stake | 0.02 ETH | 创建市场费用 |
| Min Vote Stake | 0.005 ETH | 最小投票质押 |
| Min Duration | 5 minutes | 最短市场时长 |
| Max Duration | 30 days | 最长市场时长 |

---

## 🛡️ 安全考虑

### 合约层

✅ **ReentrancyGuard** - 防止重入攻击
✅ **FHE 验证** - `FHE.req()` 约束检查
✅ **权限控制** - Owner-only 函数
✅ **状态检查** - 防止重复投票/领奖

### 前端层

✅ **输入验证** - 表单数据校验
✅ **交易确认** - 等待区块确认
✅ **错误处理** - 友好的错误提示
✅ **私钥安全** - 本地 .env 配置

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 查看 [LICENSE](./LICENSE) 文件

---

## 🔗 相关链接

- **Zama 官网**: https://www.zama.ai/
- **fhEVM 文档**: https://docs.zama.ai/fhevm
- **Zama GitHub**: https://github.com/zama-ai/fhevm
- **Relayer SDK**: https://github.com/zama-ai/fhevm-relayer-sdk

---

## 📞 支持

遇到问题？

1. 查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. 查看 Zama 官方文档
3. 提交 GitHub Issue

---

**Built with ❤️ using Zama FHE Technology**

**版本**: 1.0.0
**最后更新**: 2025-10-30
