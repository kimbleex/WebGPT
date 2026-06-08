#!/usr/bin/env node

/**
 * Vercel 部署前配置检查脚本
 * 运行: node check-deployment.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查 Vercel 部署配置...\n');

let hasError = false;
const warnings = [];
const success = [];

// 1. 检查必需文件
console.log('📁 检查必需文件...');
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'prisma/schema.prisma',
  'prisma.config.ts',
  'lib/db.ts',
  '.env.local'
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    success.push(`✅ ${file} 存在`);
  } else {
    hasError = true;
    console.log(`❌ ${file} 不存在`);
  }
});

// 2. 检查 package.json
console.log('\n📦 检查 package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  if (pkg.scripts.build && pkg.scripts.build.includes('prisma generate')) {
    success.push('✅ build 脚本包含 prisma generate');
  } else {
    hasError = true;
    console.log('❌ build 脚本缺少 prisma generate');
  }

  if (pkg.scripts.postinstall && pkg.scripts.postinstall.includes('prisma generate')) {
    success.push('✅ postinstall 脚本配置正确');
  } else {
    warnings.push('⚠️  postinstall 脚本未配置 prisma generate');
  }

  const requiredDeps = ['@prisma/client', '@prisma/adapter-pg', 'pg'];
  requiredDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      success.push(`✅ 依赖 ${dep} 已安装`);
    } else {
      hasError = true;
      console.log(`❌ 缺少依赖: ${dep}`);
    }
  });

  if (pkg.devDependencies['prisma']) {
    success.push('✅ prisma CLI 已安装');
  } else {
    hasError = true;
    console.log('❌ 缺少 prisma CLI');
  }
} catch (error) {
  hasError = true;
  console.log('❌ 无法读取 package.json:', error.message);
}

// 3. 检查 Next.js 配置
console.log('\n⚙️  检查 Next.js 配置...');
try {
  const nextConfig = fs.readFileSync('next.config.ts', 'utf8');

  if (nextConfig.includes('serverComponentsExternalPackages')) {
    if (nextConfig.includes('@prisma/client') && nextConfig.includes('@prisma/adapter-pg')) {
      success.push('✅ Next.js serverless 配置正确');
    } else {
      hasError = true;
      console.log('❌ serverComponentsExternalPackages 缺少 Prisma 包');
    }
  } else {
    hasError = true;
    console.log('❌ next.config.ts 缺少 serverComponentsExternalPackages 配置');
  }
} catch (error) {
  hasError = true;
  console.log('❌ 无法读取 next.config.ts:', error.message);
}

// 4. 检查 Prisma Schema
console.log('\n🗄️  检查 Prisma Schema...');
try {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

  if (schema.includes('provider = "postgresql"')) {
    success.push('✅ 数据库提供商配置为 postgresql');
  } else {
    hasError = true;
    console.log('❌ 数据库提供商不是 postgresql');
  }

  if (schema.includes('url = env(')) {
    console.log('⚠️  Prisma 7 不推荐在 schema.prisma 中使用 url');
    warnings.push('⚠️  考虑移除 schema.prisma 中的 url 配置');
  }
} catch (error) {
  hasError = true;
  console.log('❌ 无法读取 prisma/schema.prisma:', error.message);
}

// 5. 检查环境变量
console.log('\n🔐 检查环境变量...');
try {
  require('dotenv').config({ path: '.env.local' });
} catch {
  // dotenv 可能未安装，直接读取文件
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    warnings.push('⚠️  无法读取 .env.local');
  }
}

const requiredEnvVars = [
  'DATABASE_URL',
  'API_KEY',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'JWT_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    success.push(`✅ ${envVar} 已设置`);

    // 检查 DATABASE_URL 格式
    if (envVar === 'DATABASE_URL') {
      const dbUrl = process.env[envVar];
      if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
        success.push('✅ DATABASE_URL 格式正确');

        if (dbUrl.includes('sslmode=require') || dbUrl.includes('ssl=true')) {
          success.push('✅ DATABASE_URL 包含 SSL 配置');
        } else if (!dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
          warnings.push('⚠️  DATABASE_URL 可能缺少 SSL 配置（远程数据库建议添加 ?sslmode=require）');
        }
      } else {
        warnings.push('⚠️  DATABASE_URL 格式可能不正确');
      }
    }
  } else {
    console.log(`⚠️  环境变量 ${envVar} 未设置（确保在 Vercel 中配置）`);
    warnings.push(`⚠️  ${envVar} 未在本地设置`);
  }
});

// 6. 检查 lib/db.ts
console.log('\n🔌 检查数据库客户端配置...');
try {
  const dbFile = fs.readFileSync('lib/db.ts', 'utf8');

  if (dbFile.includes('new pg.Pool')) {
    success.push('✅ 使用 pg.Pool 连接池');
  } else {
    warnings.push('⚠️  未找到 pg.Pool 配置');
  }

  if (dbFile.includes('PrismaPg')) {
    success.push('✅ 使用 PrismaPg adapter');
  } else {
    hasError = true;
    console.log('❌ 未使用 PrismaPg adapter');
  }

  if (dbFile.includes('globalThis.prisma')) {
    success.push('✅ 使用单例模式');
  } else {
    warnings.push('⚠️  未使用单例模式，可能导致连接泄漏');
  }
} catch (error) {
  hasError = true;
  console.log('❌ 无法读取 lib/db.ts:', error.message);
}

// 打印总结
console.log('\n' + '='.repeat(50));
console.log('📊 检查总结\n');

if (success.length > 0) {
  console.log('✅ 成功项：');
  success.forEach(msg => console.log(`   ${msg}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  警告项：');
  warnings.forEach(msg => console.log(`   ${msg}`));
}

if (hasError) {
  console.log('\n❌ 发现错误！请修复后再部署到 Vercel。');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  有一些警告，但可以继续部署。');
  console.log('建议：在 Vercel Dashboard 中确认所有环境变量已正确配置。');
  process.exit(0);
} else {
  console.log('\n✅ 所有检查通过！可以部署到 Vercel。');
  console.log('\n下一步：');
  console.log('1. git add .');
  console.log('2. git commit -m "fix: optimize Prisma configuration for Vercel"');
  console.log('3. git push');
  console.log('4. 在 Vercel Dashboard 中配置环境变量');
  console.log('5. 触发重新部署');
  process.exit(0);
}
