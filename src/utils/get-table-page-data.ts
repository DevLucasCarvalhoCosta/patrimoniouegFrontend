import type { PageData } from '@/interface';

export const getTableData = <T extends any[]>(pageNum = 1, pageSize = 10, totalData: T) => {
  const total: number = totalData.length;
  const tableData: PageData<T[0]> = {
    data: [],
    pageNum,
    pageSize,
    total,
  };

  if (pageSize >= total) {
    // pageSize maior ou igual ao total: 1 página ou sem dados
    tableData.data = totalData;
    tableData.pageNum = 1; // sempre primeira página
  } else {
    // Múltiplas páginas
    const num = pageSize * (pageNum - 1); // quantidade antes da página atual

    if (num < total) {
      // Página dentro do intervalo
      const startIndex = num; // primeiro índice
      const endIndex = num + pageSize - 1; // último índice

      tableData.data = totalData.filter((_, index) => index >= startIndex && index <= endIndex);
    } else {
      // Página acima do máximo: retorna a última página existente
      const size = Math.ceil(total / pageSize); // quociente
      const rest = total % pageSize; // resto

      if (rest > 0) {
        tableData.pageNum = size + 1; // última página parcial
        tableData.data = totalData.filter((_, index) => index >= pageSize * size && index <= total);
      } else if (rest === 0) {
        tableData.pageNum = size; // última página cheia
        tableData.data = totalData.filter((_, index) => index >= pageSize * (size - 1) && index <= total);
      }
    }
  }

  return tableData;
};
