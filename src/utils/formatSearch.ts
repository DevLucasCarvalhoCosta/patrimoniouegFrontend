export function formatSearch(se: string) {
  se = decodeURIComponent(se);
  se = se.substr(1); // remove o prefixo "?"
  const arr = se.split('&'); // separa por & em pares chave=valor
  const obj: Record<string, string> = {};
  let newarr = [];

  arr.forEach((v, i) => {
    // iterar cada par chave=valor
    console.log(v);
    console.log(i);
    newarr = v.split('=');

    if (typeof obj[newarr[0]] === 'undefined') {
      obj[newarr[0]] = newarr[1];
    }
  });

  return obj;
}
