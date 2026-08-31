export type PortfolioImage = {
  src: string;
  alt: string;
  caption?: string;
  layout?: 'portrait' | 'medium';
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
    year: '2025',
    location: '重庆 · 东京',
    statement: '江岸、街巷、轨道与灯光把城市编织成不断变化的截面。镜头沿着人流与交通移动，记录秩序被速度短暂点亮的时刻。',
    cover: '/portfolio/urban-pulse/chongqing-zbz-9292.jpg',
    images: [
      { src: '/portfolio/urban-pulse/chongqing-zbz-9292.jpg', alt: '夜色中被船舶光轨环绕的重庆江岸', caption: '重庆 · 2025' },
      { src: '/portfolio/urban-pulse/chongqing-zbz-9356.jpg', alt: '铁网框景下的重庆高层建筑', caption: '重庆 · 2025', layout: 'portrait' },
      { src: '/portfolio/urban-pulse/tokyo-zbz-8136.jpg', alt: '电线与街巷之间的东京晴空塔', caption: '东京 · 2025', layout: 'portrait' },
      { src: '/portfolio/urban-pulse/tokyo-zbz-8295.jpg', alt: '东京夜间街巷与霓虹招牌', caption: '东京 · 2025', layout: 'portrait' },
      { src: '/portfolio/urban-pulse/tokyo-zbz-8187.jpg', alt: '林荫参道尽头的鸟居', caption: '东京 · 2025' },
      { src: '/portfolio/urban-pulse/tokyo-zbz-8379.jpg', alt: '东京街道与远处的东京塔', caption: '东京 · 2025', layout: 'portrait' },
      { src: '/portfolio/urban-pulse/tokyo-ochanomizu-trains.jpg', alt: '御茶之水多列电车交汇的城市景观', caption: '东京 · 御茶之水 · 2025', layout: 'portrait' },
    ],
  },
  {
    slug: 'distant-weather',
    title: '远方的天气',
    englishTitle: 'Distant Weather',
    category: '风光',
    year: '2025',
    location: '香格里拉 · 梅里雪山 · 平潭 · 甘南',
    statement: '天气改变地景，也改变观看的方式。雾、风和短暂的光，在辽阔尺度中留下难以复现的瞬间。',
    cover: '/portfolio/dsc-2989-shangri-la.jpg',
    coverPosition: 'center 45%',
    images: [
      { src: '/portfolio/dsc-2989-shangri-la.jpg', alt: '晨光与薄雾中的香格里拉建筑群', caption: '香格里拉 · 2025' },
      { src: '/portfolio/zbz-1242-meili.jpg', alt: '星轨下的梅里雪山雪峰', caption: '梅里雪山 · 2025', layout: 'medium' },
      { src: '/portfolio/distant-weather/pingtan-dsc-5082.jpg', alt: '夜色中发出蓝光的平潭海浪', caption: '平潭 · 2025' },
      { src: '/portfolio/distant-weather/pingtan-dsc-5328.jpg', alt: '蓝色荧光海浪的俯视画面', caption: '平潭 · 2025' },
      { src: '/portfolio/distant-weather/pingtan-zbz-2955.jpg', alt: '蓝色荧光海浪与礁石', caption: '平潭 · 2025' },
      { src: '/portfolio/distant-weather/gannan-dji-0934.jpg', alt: '双彩虹落在甘南山间湖泊与草地之间', caption: '甘南 · 2025' },
    ],
  },
  {
    slug: 'textures-of-time',
    title: '时间的纹理',
    englishTitle: 'Textures of Time',
    category: '人文',
    year: '2025',
    location: '大同 · 应县 · 景德镇',
    statement: '石窟、木构与民艺在时间中留下各自的表面。光线落在雕刻、斗拱与织物上，让历史不再遥远。',
    cover: '/portfolio/textures-of-time/datong-zbz-3752.jpg',
    coverPosition: 'center 42%',
    images: [
      { src: '/portfolio/textures-of-time/datong-zbz-3752.jpg', alt: '洞窟光线中的大同石刻造像', caption: '大同 · 2025', layout: 'portrait' },
      { src: '/portfolio/textures-of-time/yingxian-zbz-4640.jpg', alt: '林木环绕的应县木塔', caption: '应县 · 2025', layout: 'portrait' },
      { src: '/portfolio/textures-of-time/jingdezhen-zbz-9983.jpg', alt: '景德镇街头龙形表演道具的细节', caption: '景德镇 · 2025', layout: 'portrait' },
    ],
  },
];

export function getSeries(slug: string) {
  return series.find((item) => item.slug === slug);
}
