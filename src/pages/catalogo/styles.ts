import styled from '@emotion/styled';

export const CARD_HEIGHT = 240; // altura um pouco maior para comportar imagem de capa

type Palette = {
  bg: string;
  border: string;
  text: string;
  textSecondary: string;
  shadow: string;
  radius: number;
};

export function makeCatalogUI(token: any) {
  const pal: Palette = {
    bg: token?.colorBgContainer ?? '#fff',
    border: token?.colorBorderSecondary ?? 'rgba(0,0,0,0.15)',
    text: token?.colorText ?? 'rgba(0,0,0,0.88)',
    textSecondary: token?.colorTextSecondary ?? 'rgba(0,0,0,0.45)',
    shadow: token?.boxShadowSecondary ?? '0 6px 16px rgba(0,0,0,0.2)',
    radius: token?.borderRadiusLG ?? 8,
  };

  const Section = styled.div`
    width: 100%;
  `;

  const ListItem = styled.div`
    display: flex;
    width: 100%;
    align-items: stretch;
  `;

  const CardBox = styled.div`
    width: 100%;
    min-width: 0; /* evita crescer por conteúdo */
    /* altura base, mas permite crescer com conteúdo */
    min-height: ${CARD_HEIGHT}px;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    border-radius: ${pal.radius}px;
    background: ${pal.bg};
    border: 1px solid ${pal.border};
    transition: box-shadow 0.2s ease, transform 0.2s ease;
    overflow: hidden;
    box-sizing: border-box;

    &:hover {
      box-shadow: ${pal.shadow};
      transform: translateY(-2px);
    }
  `;

  const Cover = styled.div`
    height: 110px;
    min-height: 110px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid ${pal.border};
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain; /* mostrar inteira sem cortar */
      display: block;
    }
  `;

  const Header = styled.div`
    padding: 8px 16px; /* reduzido para comportar várias linhas de título */
    display: flex;
    align-items: flex-start;
    gap: 8px;
    border-bottom: 1px solid ${pal.border};
  `;

  const Title = styled.div`
    font-weight: 600;
    color: ${pal.text};
    flex: 1;
    min-width: 0;
    /* permitir múltiplas linhas, quebrando palavras longas quando necessário */
    white-space: pre-wrap;
    word-break: break-word;
  `;

  const Extra = styled.div`
    margin-left: 8px;
    display: flex;
    align-items: center;
    flex: 0 0 auto;
  `;

  const Body = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 16px;
    color: ${pal.text};
  `;

  const Thumbs = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: nowrap;
    overflow: hidden;

    img, .thumb {
      width: 36px;
      height: 28px;
      border-radius: 4px;
      object-fit: cover;
      background: #fafafa;
      border: 1px solid ${pal.border};
    }

    .thumb-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${pal.textSecondary};
      font-size: 10px;
    }
  `;

  const Subtle = styled.div`
    color: ${pal.textSecondary};
  `;

  const Clamp2 = styled.div`
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `;

  // Descrição completa com quebras de linha preservadas
  const Description = styled.div`
    white-space: pre-wrap; /* preserva \n e quebra automaticamente */
    word-break: break-word; /* evita overflow por palavras longas */
  `;

  return { Section, ListItem, CardBox, Header, Title, Extra, Body, Subtle, Clamp2, Cover, Thumbs, Description };
}
