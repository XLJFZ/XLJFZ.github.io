# Display P3 重新导出清单

核对日期：2026-10-11。原文件只读。已将 24 张作品的 72 个预览档位，以及城市两档封面、风光移动封面更新为带 ICC 的 Display P3；首页两档已从 Rec.2020 原导出重新生成并保留来源 ICC；另外 32 个来源按用户确认保持现状，不再等待重新导出。发布状态以对应提交及 GitHub Pages 部署记录为准。

56 张作品及 1 张首页图中：24 张作品已更新为 P3，首页保留 Rec.2020，其他 32 张作品按用户确认保留现状；下方 33 项清单为原核对记录，首页项现已解决，其余项已取消重导。

请在 Lightroom 中保持原有裁切、调色、水印和构图，导出 JPEG、Display P3、高质量，并保留拍摄参数供核验。导出到新的独立文件夹，不覆盖已有文件。高质量图保存在仓库外，网站再生成不超过 4096px 长边的展示版本。

北京 AVIF 使用 CICP 12/13 声明 Display P3，不能因为没有 ICC 就判定为 sRGB。

乌兰布统以用户截图对照的 `ZBZ_0723.avif` 为准：该文件声明 CICP 12/13，无 ICC。先为解码后的 P3 RGB 样本关联 P3 ICC，再缩放输出，避免误按 sRGB 解读。1200、1800、4096 三档与来源同空间 RGB 缩小样本对照，平均绝对误差均小于 0.43/255（包含缩放与 JPEG 编码差异）。这验证文件处理一致性，不能证明不同应用和显示器完全相同。

## 历史重导清单（已取消）

| 网站对应作品 | 来源色彩配置 | 现有导出文件 |
|---|---|---|
| urban-pulse/tokyo-zbz-8136 | sRGB IEC61966-2.1 | `D:\照片\大一 寒假\2025.01.19-25 日本（东京+大阪+京都）\ZBZ_8136-HDR.jpg` |
| urban-pulse/tokyo-zbz-8295 | sRGB IEC61966-2.1 | `D:\照片\大一 寒假\2025.01.19-25 日本（东京+大阪+京都）\ZBZ_8295.jpg` |
| urban-pulse/tokyo-zbz-8187 | sRGB IEC61966-2.1 | `D:\照片\大一 寒假\2025.01.19-25 日本（东京+大阪+京都）\ZBZ_8187.jpg` |
| urban-pulse/tokyo-zbz-8379 | sRGB IEC61966-2.1 | `D:\照片\大一 寒假\2025.01.19-25 日本（东京+大阪+京都）\ZBZ_8379.jpg` |
| urban-pulse/tokyo-ochanomizu-trains | sRGB IEC61966-2.1 | `D:\照片\大一 寒假\2025.01.19-25 日本（东京+大阪+京都）\御茶之水 电车合成.jpg` |
| urban-pulse/shanghai-dji-0314 | sRGB IEC61966-2.1 | `D:\照片\大一 暑假\2024.07.17 朝霞 航拍\DJI_20240717042249_0314_D-已增强-降噪.jpg` |
| urban-pulse/shanghai-img-150846 | sRGB IEC61966-2.1 | `D:\照片\大一 暑假\2024.07.03 武康大楼附近\未命名导出\ZBZ_5757.jpg` |
| urban-pulse/shanghai-img-150903 | sRGB IEC61966-2.1 | `D:\照片\大一 暑假\2024.07.03 武康大楼附近\未命名导出\ZBZ_5724.jpg` |
| urban-pulse/shanghai-img-173301 | sRGB IEC61966-2.1 | `D:\照片\浦东美术馆 RAW\_ZBZ1237.jpg` |
| urban-pulse/shanghai-zbz-0216 | sRGB IEC61966-2.1 | `D:\照片\大一 寒假\2025.02.13 豫园 百联ZX 愚园路附近\ZBZ_0216.jpg` |
| urban-pulse/shanghai-zbz-9081 | sRGB IEC61966-2.1 | `D:\照片\大一 暑假\2024.07.31 栖霞路东方路天桥+国金+金茂底下\未命名导出\ZBZ_9081.jpg` |
| urban-pulse/guangzhou-zbz-6789 | sRGB IEC61966-2.1 | `D:\照片\大二 暑假\2025.08.08-13 广州-深圳-香港\ZBZ_6789.jpg` |
| urban-pulse/guangzhou-rpx-00040 | sRGB IEC61966-2.1 | `D:\照片\大二 暑假\2025.08.08-13 广州-深圳-香港\RPX00040.jpg` |
| urban-pulse/shenzhen-zbz-7358 | sRGB IEC61966-2.1 | `D:\照片\大二 暑假\2025.08.08-13 广州-深圳-香港\ZBZ_7358-1.jpg` |
| urban-pulse/nanchang-zbz-1447 | sRGB IEC61966-2.1 | `D:\照片\大一 暑假\2024.08.17 南昌+上饶\未命名导出\ZBZ_1447.jpg` |
| urban-pulse/nanchang-zbz-1370 | sRGB IEC61966-2.1 | `D:\照片\大一 暑假\2024.08.17 南昌+上饶\未命名导出\ZBZ_1370.jpg` |
| urban-pulse/hong-kong-zbz-7859 | sRGB IEC61966-2.1 | `D:\照片\大二 暑假\2025.08.08-13 广州-深圳-香港\ZBZ_7859.jpg` |
| urban-pulse/hong-kong-zbz-8039 | sRGB IEC61966-2.1 | `D:\照片\大二 暑假\2025.08.08-13 广州-深圳-香港\ZBZ_8039.jpg` |
| urban-pulse/hong-kong-victoria-harbour | sRGB IEC61966-2.1 | `D:\照片\大二 暑假\2025.08.08-13 广州-深圳-香港\维多利亚港-长曝光.jpg` |
| distant-weather/gannan-dji-0934 | sRGB IEC61966-2.1 | `D:\照片\大一 下\甘南\DJI_20250710200615_0934_D-HDR.jpg` |
| distant-weather/pingtan-dsc-5082 | sRGB IEC61966-2.1 | `D:\照片\大一 下\2025.05.12 福州+平潭\_DSC5082-已增强-降噪.jpg` |
| distant-weather/pingtan-dsc-5328 | sRGB IEC61966-2.1 | `D:\照片\大一 下\2025.05.12 福州+平潭\_DSC5328-已增强-降噪.jpg` |
| distant-weather/pingtan-zbz-2955 | sRGB IEC61966-2.1 | `D:\照片\大一 下\2025.05.12 福州+平潭\ZBZ_2955-已增强-降噪.jpg` |
| distant-weather/ninghai-zbz-6273 | sRGB IEC61966-2.1 | `D:\照片\大一 暑假\2024.07.05 宁海\未命名导出\ZBZ_6273.jpg` |
| distant-weather/ninghai-zbz-6289 | sRGB IEC61966-2.1 | `D:\照片\大一 暑假\2024.07.05 宁海\未命名导出\ZBZ_6289.jpg` |
| textures-of-time/datong-zbz-3752 | sRGB IEC61966-2.1 | `D:\照片\大一 下\2025.06.25-29 山西 太原+大同\ZBZ_3752.jpg` |
| textures-of-time/yingxian-zbz-4640 | sRGB IEC61966-2.1 | `D:\照片\大一 下\2025.06.25-29 山西 太原+大同\ZBZ_4640.jpg` |
| textures-of-time/jingdezhen-zbz-9983 | sRGB IEC61966-2.1 | `D:\照片\大一 寒假\2025.02.01 景德镇 陶阳里\ZBZ_9983.jpg` |
| textures-of-time/xian-zbz-0868 | sRGB IEC61966-2.1 | `D:\照片\大一 下\2025.02.16 吉祥村 老菜场\ZBZ_0868-已增强-降噪.jpg` |
| textures-of-time/xian-zbz-0861 | sRGB IEC61966-2.1 | `D:\照片\大一 下\2025.02.16 吉祥村 老菜场\ZBZ_0861.jpg` |
| nearby-moments/football-zbz-8440 | sRGB IEC61966-2.1 | `D:\照片\高二 下\2022.6.29 足球\未命名导出\_ZBZ8440.jpg` |
| nearby-moments/cat-img-20240724 | sRGB IEC61966-2.1 | `D:\照片\大一 暑假\2024.07.19-26 西安\未命名导出\ZBZ_8502-已增强-降噪.jpg` |
| hero-zbz-2714 | Rec. 2020 | `D:\照片\大二 上\2025.11.27-12.3 丽江 香格里拉 德钦 旅拍\ZBZ_2714-参赛.jpg` |

## 已找到的 P3 来源

| 网站对应作品 | 文件 |
|---|---|
| urban-pulse/chongqing-zbz-9292-hq | `D:\照片\大二 上\2025.10.04-08 重庆旅拍\ZBZ_9292.jpg` |
| urban-pulse/chongqing-zbz-9356 | `D:\照片\大二 上\2025.10.04-08 重庆旅拍\ZBZ_9356_SDR.jpg` |
| urban-pulse/shanghai-zbz-8199 | `D:\照片\大二 暑假\2025.08.15 - 外滩天幕1715\ZBZ_8199.jpg` |
| urban-pulse/shanghai-zbz-8285 | `D:\照片\大三 暑假\2026.07.26-27 唐城公寓 蓝调+朝霞\ZBZ_8285.jpg` |
| urban-pulse/shanghai-zbz-7973 | `D:\照片\大三 暑假\2026.07.25 洛克·外滩源\ZBZ_7973.jpg` |
| urban-pulse/shanghai-zbz-7974 | `D:\照片\大三 暑假\2026.07.25 洛克·外滩源\ZBZ_7974.jpg` |
| urban-pulse/shanghai-zbz-8705 | `D:\照片\大三 暑假\2026.08.08 明日星城 晚霞\ZBZ_8705.jpg` |
| urban-pulse/hong-kong-zbz-8030 | `D:\照片\大二 暑假\2025.08.08-13 广州-深圳-香港\ZBZ_8030.jpg` |
| urban-pulse/hong-kong-zbz-8171 | `D:\照片\大二 暑假\2025.08.08-13 广州-深圳-香港\ZBZ_8171.jpg` |
| urban-pulse/beijing-zbz-9255 | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9255.avif` |
| urban-pulse/beijing-zbz-9525 | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9525.avif` |
| urban-pulse/beijing-zbz-9533 | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9533.avif` |
| urban-pulse/beijing-zbz-9542 | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9542.avif` |
| urban-pulse/beijing-zbz-9556 | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9556.avif` |
| urban-pulse/beijing-zbz-9579 | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9579.avif` |
| urban-pulse/beijing-zbz-9633-hdr | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9633-HDR.avif` |
| urban-pulse/beijing-zbz-9649 | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9649.avif` |
| urban-pulse/beijing-zbz-9670 | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9670.avif` |
| distant-weather/dsc-2989-shangri-la | `D:\照片\大二 上\2025.11.27-12.3 丽江 香格里拉 德钦 旅拍\DSC_2989.jpg` |
| distant-weather/zbz-1242-meili | `D:\照片\大二 上\2025.11.27-12.3 丽江 香格里拉 德钦 旅拍\ZBZ_1242.jpg` |
| textures-of-time/huizhou-zbz-6156 | `D:\照片\大二 寒假\2026.02.18-20 黄山-瞻淇+呈坎\ZBZ_6156.jpg` |
| textures-of-time/huizhou-zbz-5682 | `D:\照片\大二 寒假\2026.02.18-20 黄山-瞻淇+呈坎\ZBZ_5682.jpg` |
| textures-of-time/beijing-zbz-9496 | `D:\照片\大三 暑假\2026.08.16-19 北京\ZBZ_9496.avif` |
| nearby-moments/wulanbutong-zbz-0723 | `D:\照片\大三 上\2026.10.02-06 赤峰（乌兰布统周边）\ZBZ_0723.avif` |

## EXIF 限制

御茶之水电车合成图的两个导出均无内嵌 EXIF。2026-10-11 用户明确指定 ZBZ_8300–8302 的素材代表参数：Nikon Z7 II、29mm、f/7.1、1/160s、ISO 64；三个旁车读取结果一致。展示数据采用这组参数，核对记录保留素材代表参数说明。

已通过逐张画面对照补全 10 张作品，并按用户确认补全御茶之水合成图的素材代表参数；56 张作品现在全部包含五项参数展示记录。来源及核实值见 [EXIF 核对记录](EXIF-BACKFILL-2026-10-11.json)。已迁移来源、原文件哈希见 [P3 来源记录](P3-MIGRATION-2026-10-11.json)。旧预览备份在 `outputs/p3-deployment-1791719280969/previous`，封面备份在 `outputs/p3-covers-1791719403939`。

色彩处理依据：[Sharp 输出 ICC](https://sharp.pixelplumbing.com/api-output/#withiccprofile)、[Display P3 定义](https://www.w3.org/TR/css-color-4/#predefined-display-p3)。



