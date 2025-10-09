export const products = [
  {
    id: '1',
    name: "Kebab Sapi Spesial",
    description: 'Kebab lezat dengan daging sapi pilihan, sayuran segar, dan saus spesial turki',
    price: 22000,
    image: '/public/assets/kebabayam.jpeg',
    category: 'kebab',
    stock: 100
  },
  {
    id: '2',
    name: 'Kebab Ayam Spesial',
    description: 'Kebab ayam dengan bumbu rempah khas timur tengah dan keju mozzarella',
    price: 20000,
    image: '/public/assets/kebablumer.jpeg',
    category: 'kebab',
    stock: 100
  },
  {
    id: '3',
    name: 'Kebab Lumer',
    description: 'Kebab ukuran jumbo dengan daging sapi serta saus asam manis',
    price: 26000,
    image: '/public/assets/kebaab.jpeg',
    category: 'kebab',
    stock: 100
  },
  {
    id: '4',
    name: 'Kebab Unta Pedas',
    description: 'Kebab ukuran jumbo dengan daging unta pilihan yang menggugah selera',
    price: 28000,
    image: '/public/assets/fulldagingwak.jpeg',
    category: 'kebab',
    stock: 100
  },
  {
    id: '5',
    name: 'Kebab 20 cm',
    description: 'Kebab sapi premium dengan ukuran 20 cm dengan sayuran lengkap',
    price: 35000,
    image: '/public/assets/shawarmaisi.jpeg',
    category: 'kebab',
    stock: 100
  },
  {
    id: '6',
    name: 'Kebab Vegetarian',
    description: 'Kebab sehat dengan sayuran segar, tahu, tahu dan saus istimewa',
    price: 25000,
    image: '/public/assets/kebabcihuy.jpeg',
    category: 'kebab',
    stock: 100
  },
  {
    id: '7',
    name: 'Milkshake Oreo',
    description: 'Minuman susu dingin segar dengan oreo',
    price: 15000,
    image: '/public/assets/oreoo.jpeg',
    category: 'minuman',
    stock: 100
  },
  {
    id: '8',
    name: 'Sosis Bakar',
    description: '1 porsi sosis bakar cocok dihidangkan bersama kebab',
    price: 18000,
    image: '/public/assets/sobar.jpeg',
    category: 'minuman',
    stock: 100
  },
  {
    id: '9',
    name: 'Cookies Chocolatte',
    description: 'Kue kering yang berasal dari Garut dan memiliki butir cokelat sebagai bahan pembeda.',
    price: 13000,
    image: '/public/assets/cookies.jpeg',
    category: 'minuman',
    stock: 100
  }
];

export function getProducts() {
  return products;
}

export function searchProducts(query) {
  const lowerQuery = query.toLowerCase();
  return products.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery)
  );
}

export function getProductById(id) {
  return products.find(p => p.id === id);
}
