const css = `
body {
  margin: 0;
  background: #f7f5f4;
  color: #222222;
  font-family: sans-serif;
}
main {
  max-width: 36rem;
  padding: 32px 24px;
}
h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 16px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
li {
  padding: 12px 0;
  border-top: 1px solid #e4e0df;
}
`.trim();

function page(title: string, items: readonly string[]): string {
  const menu =
    items.length === 0
      ? ''
      : `<ul>
${items.map((item) => `<li>${item}</li>`).join('\n')}
</ul>`;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
${css}
</style>
</head>
<body>
<main>
<h1>${title}</h1>
${menu}
</main>
</body>
</html>`;
}

const baursak = 'Баурсак, 500 ₸';
const croissant = 'Круассан, 900 ₸';

export const sampleSites: Record<string, string> = {
  'nan-v1.zip': page('Пекарня Нан', [baursak]),
  'nan-v2.zip': page('Пекарня Нан', [baursak, croissant]),
  'nan-v3.zip': page('Пекарня Нан', []),
  'nan-v4.zip': page('Пекарня Нан', []),
  'nan-storage.zip': page('Пекарня Нан', []),
  'temir-v1.zip': page('Мастерская Темир', ['Заточка ножа, 2 000 ₸']),
};
