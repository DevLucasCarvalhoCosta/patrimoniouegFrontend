import type { MyResponse } from './request';
import type { PageData } from '@/interface';
import type { BuniesssUser } from '@/interface/business';

// Demo API: retorna uma lista paginada fake para as páginas de exemplo em src/pages/business
export const getBusinessUserList = async (
	params?: Partial<{ pageSize: number; pageNum: number } & Record<string, any>>,
): MyResponse<PageData<BuniesssUser>> => {
	const pageSize = Math.max(1, Number(params?.pageSize) || 20);
	const pageNum = Math.max(1, Number(params?.pageNum) || 1);
	const total = 137;

	const start = (pageNum - 1) * pageSize;
	const end = Math.min(start + pageSize, total);
  
	const data: BuniesssUser[] = Array.from({ length: Math.max(0, end - start) }, (_, i) => {
		const id = start + i + 1;

		return {
			key: String(id),
			firstName: `User${id}`,
			lastName: `Last${id}`,
			age: 18 + ((id * 7) % 40),
			address: `Rua ${id}, Centro`,
			tags: id % 3 === 0 ? ['active', 'beta'] : id % 2 === 0 ? ['new'] : ['vip'],
		};
	});

	return Promise.resolve({
		status: true,
		message: 'success',
		result: { pageNum, pageSize, total, data },
	});
};

export default {};
