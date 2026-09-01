export type PortfolioImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  layout?: 'portrait' | 'medium' | 'wide';
};

export type Series = {
  slug: string;
  title: string;
  englishTitle: string;
  category: string;
  year: string;
  location: string;
  statement: string;
  cover: string;
  coverPosition?: string;
  images: PortfolioImage[];
};

export const series: Series[] = [
  {
    slug: 'urban-pulse',
    title: '城市脉冲',
    englishTitle: 'Urban Pulse',
    category: '城市',
    year: '2022—2026',
    location: '重庆 · 东京 · 上海 · 广州 · 深圳 · 南昌 · 香港',
    statement:
      '江岸、街巷、轨道与灯光把城市编织成不断变化的截面。镜头沿着人流与交通移动，记录秩序被速度短暂点亮的时刻。',
    cover: '/portfolio/urban-pulse/chongqing-zbz-9292-hq.jpg',
    images: [
      {
        src: '/portfolio/urban-pulse/chongqing-zbz-9292-hq.jpg',
        width: 3200,
        height: 1953,
        alt: '夜色中被船舶光轨环绕的重庆江岸',
        caption: '重庆 · 2025',
        layout: 'wide',
      },
      {
        src: '/portfolio/urban-pulse/chongqing-zbz-9356.jpg',
        width: 2240,
        height: 2800,
        alt: '铁网框景下的重庆高层建筑',
        caption: '重庆 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/tokyo-zbz-8136.jpg',
        width: 1680,
        height: 2800,
        alt: '电线与街巷之间的东京晴空塔',
        caption: '东京 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/tokyo-zbz-8295.jpg',
        width: 2240,
        height: 2800,
        alt: '东京夜间街巷与霓虹招牌',
        caption: '东京 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/tokyo-zbz-8187.jpg',
        width: 2800,
        height: 1200,
        alt: '林荫参道尽头的鸟居',
        caption: '东京 · 2025',
        layout: 'wide',
      },
      {
        src: '/portfolio/urban-pulse/tokyo-zbz-8379.jpg',
        width: 1867,
        height: 2800,
        alt: '东京街道与远处的东京塔',
        caption: '东京 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/tokyo-ochanomizu-trains.jpg',
        width: 1866,
        height: 2800,
        alt: '御茶之水多列电车交汇的城市景观',
        caption: '东京 · 御茶之水 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-zbz-8199.jpg',
        width: 2800,
        height: 2041,
        alt: '蓝调夜色中的上海城市天际线与黄浦江',
        caption: '上海 · 2025',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-zbz-8285.jpg',
        width: 1867,
        height: 2800,
        alt: '粉紫朝霞下的上海城市天际线与里弄',
        caption: '上海 · 2026',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-zbz-7973.jpg',
        width: 1867,
        height: 2800,
        alt: '洛克·外滩源街区建筑与斜射光影',
        caption: '上海 · 2026',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-zbz-8705.jpg',
        width: 2800,
        height: 1655,
        alt: '橙色晚霞笼罩上海城市天际线',
        caption: '上海 · 2026',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-dji-0314.jpg',
        width: 2800,
        height: 1575,
        alt: '蓝调与粉色晚霞下的上海陆家嘴天际线',
        caption: '上海 · 2024',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-img-150846.jpg',
        width: 1925,
        height: 2800,
        alt: '雨夜车流光轨掠过上海武康大楼',
        caption: '上海 · 2024',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-img-150903.jpg',
        width: 2373,
        height: 2800,
        alt: '晴天下的上海武康大楼与街口车流',
        caption: '上海 · 2024',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-img-173301.jpg',
        width: 4096,
        height: 1680,
        alt: '黑白画面中的上海行人与建筑光影',
        caption: '上海 · 2022',
        layout: 'wide',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-zbz-0216.jpg',
        width: 5228,
        height: 6369,
        alt: '上海街角阳光下的咖啡馆与自行车',
        caption: '上海 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/shanghai-zbz-9081.jpg',
        width: 1886,
        height: 2800,
        alt: '上海老街通向陆家嘴高楼的红色车轨',
        caption: '上海 · 2024',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/guangzhou-zbz-6789.jpg',
        width: 1787,
        height: 2800,
        alt: '广州石室圣心大教堂与街道人群',
        caption: '广州 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/guangzhou-rpx-00040.jpg',
        width: 2240,
        height: 2800,
        alt: '草坡上的行人与广州珠江新城高楼',
        caption: '广州 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/shenzhen-zbz-7358.jpg',
        width: 2057,
        height: 2800,
        alt: '长曝光云层下的深圳城市天际线',
        caption: '深圳 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/nanchang-zbz-1447.jpg',
        width: 2800,
        height: 1867,
        alt: '低角度仰望南昌摩天轮座舱',
        caption: '南昌 · 2024',
      },
      {
        src: '/portfolio/urban-pulse/nanchang-zbz-1370.jpg',
        width: 1807,
        height: 2800,
        alt: '南昌红谷滩商务区与城市道路',
        caption: '南昌 · 2024',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/hong-kong-zbz-7859.jpg',
        width: 1809,
        height: 2800,
        alt: '香港现代主义白色建筑立面与红色出租车',
        caption: '香港 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/hong-kong-zbz-8030.jpg',
        width: 2240,
        height: 2800,
        alt: '香港中环夜色中的电车站与行人',
        caption: '香港 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/urban-pulse/hong-kong-zbz-8039.jpg',
        width: 2800,
        height: 2000,
        alt: '霓虹招牌与出租车构成的香港夜间街角',
        caption: '香港 · 2025',
      },
      {
        src: '/portfolio/urban-pulse/hong-kong-victoria-harbour.jpg',
        width: 2800,
        height: 1750,
        alt: '长曝光下的维多利亚港与香港岛天际线',
        caption: '香港 · 维多利亚港 · 2025',
        layout: 'wide',
      },
      {
        src: '/portfolio/urban-pulse/hong-kong-zbz-8171.jpg',
        width: 1867,
        height: 2800,
        alt: '香港夜间道路上的电车与车流光轨',
        caption: '香港 · 2025',
        layout: 'portrait',
      },
    ],
  },
  {
    slug: 'distant-weather',
    title: '远方的天气',
    englishTitle: 'Distant Weather',
    category: '风光',
    year: '2024—2025',
    location: '香格里拉 · 德钦 · 甘南 · 平潭 · 宁海',
    statement:
      '天气改变地景，也改变观看的方式。雾、风和短暂的光，在辽阔尺度中留下难以复现的瞬间。',
    cover: '/portfolio/dsc-2989-shangri-la.jpg',
    coverPosition: 'center 45%',
    images: [
      {
        src: '/portfolio/dsc-2989-shangri-la.jpg',
        width: 2800,
        height: 1034,
        alt: '晨光与薄雾中的香格里拉建筑群',
        caption: '香格里拉 · 2025',
        layout: 'wide',
      },
      {
        src: '/portfolio/zbz-1242-meili.jpg',
        width: 2800,
        height: 2800,
        alt: '星轨下的梅里雪山雪峰',
        caption: '德钦 · 2025',
        layout: 'medium',
      },
      {
        src: '/portfolio/distant-weather/gannan-dji-0934.jpg',
        width: 2800,
        height: 1866,
        alt: '双彩虹落在甘南山间湖泊与草地之间',
        caption: '甘南 · 2025',
      },
      {
        src: '/portfolio/distant-weather/pingtan-dsc-5082.jpg',
        width: 2800,
        height: 1750,
        alt: '夜色中发出蓝光的平潭海浪',
        caption: '平潭 · 2025',
      },
      {
        src: '/portfolio/distant-weather/pingtan-dsc-5328.jpg',
        width: 2800,
        height: 1750,
        alt: '蓝色荧光海浪的俯视画面',
        caption: '平潭 · 2025',
      },
      {
        src: '/portfolio/distant-weather/pingtan-zbz-2955.jpg',
        width: 2800,
        height: 1884,
        alt: '蓝色荧光海浪与礁石',
        caption: '平潭 · 2025',
      },
      {
        src: '/portfolio/distant-weather/ninghai-zbz-6273.jpg',
        width: 2800,
        height: 1867,
        alt: '金色云海中的宁海风力发电机与近景花朵',
        caption: '宁海 · 2024',
      },
      {
        src: '/portfolio/distant-weather/ninghai-zbz-6289.jpg',
        width: 2240,
        height: 2800,
        alt: '晨光穿过宁海云海、山脊与茶园',
        caption: '宁海 · 2024',
        layout: 'portrait',
      },
    ],
  },
  {
    slug: 'textures-of-time',
    title: '时间的纹理',
    englishTitle: 'Textures of Time',
    category: '人文',
    year: '2025',
    location: '大同 · 应县 · 景德镇 · 西安',
    statement:
      '石窟、木构、室内与民艺在时间中留下各自的表面。光线落在雕刻、斗拱、织物与日常器物上，让历史不再遥远。',
    cover: '/portfolio/textures-of-time/xian-zbz-0868.jpg',
    coverPosition: 'center 38%',
    images: [
      {
        src: '/portfolio/textures-of-time/datong-zbz-3752.jpg',
        width: 2000,
        height: 2800,
        alt: '洞窟光线中的大同石刻造像',
        caption: '大同 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/textures-of-time/yingxian-zbz-4640.jpg',
        width: 2240,
        height: 2800,
        alt: '林木环绕的应县木塔',
        caption: '应县 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/textures-of-time/jingdezhen-zbz-9983.jpg',
        width: 2240,
        height: 2800,
        alt: '景德镇街头龙形表演道具的细节',
        caption: '景德镇 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/textures-of-time/xian-zbz-0868.jpg',
        width: 4683,
        height: 6336,
        alt: '涂满文字的鲸鱼装置与窗前人物',
        caption: '西安 · 2025',
        layout: 'portrait',
      },
      {
        src: '/portfolio/textures-of-time/xian-zbz-0861.jpg',
        width: 5504,
        height: 6880,
        alt: '窗帘与室内陈设交叠的午后光线',
        caption: '西安 · 2025',
        layout: 'portrait',
      },
    ],
  },
];

export function getSeries(slug: string) {
  return series.find((item) => item.slug === slug);
}
