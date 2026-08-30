export type Series = {
  slug: string;
  title: string;
  englishTitle: string;
  category: string;
  year: string;
  location: string;
  statement: string;
  cover: string;
  images: { src: string; alt: string; position?: string }[];
};

export const series: Series[] = [
  {
    slug: 'concrete-silence',
    title: '混凝土的静默',
    englishTitle: 'Concrete Silence',
    category: '建筑',
    year: '2024—2026',
    location: '上海 · 苏州 · 杭州',
    statement: '当人群离开，建筑显露出真正的呼吸。这组作品关注混凝土、光线与留白之间微妙的秩序。',
    cover: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=2200&q=88',
    images: [
      { src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=2200&q=88', alt: '白色现代建筑的几何立面' },
      { src: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=88', alt: '粗野主义建筑与天空' },
      { src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=88', alt: '现代室内空间与光影' },
      { src: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=88', alt: '高层建筑向上视角' },
      { src: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2200&q=88', alt: '混凝土立面细节', position: 'center 35%' },
    ],
  },
  {
    slug: 'distant-weather',
    title: '远方的天气',
    englishTitle: 'Distant Weather',
    category: '风景',
    year: '2023—2025',
    location: '川西 · 云南 · 青海',
    statement: '天气改变地景，也改变观看的方式。雾、风和短暂的光，在辽阔尺度中留下难以复现的瞬间。',
    cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=88',
    images: [
      { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=88', alt: '云雾中的山峰' },
      { src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=88', alt: '晨雾中的原野' },
      { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=88', alt: '森林中的光线' },
      { src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=88', alt: '山谷湖泊与远山' },
      { src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2200&q=88', alt: '荒野道路与远方山脉' },
    ],
  },
];

export function getSeries(slug: string) {
  return series.find((item) => item.slug === slug);
}
