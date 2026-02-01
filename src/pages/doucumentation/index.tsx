import type { FC } from 'react';

import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

const div = <div style={{ height: 200 }}>Conteúdo em desenvolvimento</div>;

const DocumentationPage: FC = () => {
  return (
    <div>
      <Typography className="innerText">
        <Title>Introdução</Title>
        <Paragraph>Esta é a documentação do sistema de administração React Antd.</Paragraph>
        <Title>Catálogo</Title>
        <Paragraph>Aqui estão os principais tópicos da documentação:</Paragraph>
        <Paragraph>
          <ul>
            <li>
              <a href="#layout">Layout</a>
            </li>
            <li>
              <a href="#routes">Rotas</a>
            </li>
            <li>
              <a href="#request">Requisições</a>
            </li>
            <li>
              <a href="#theme">Tema</a>
            </li>
            <li>
              <a href="#typescript">TypeScript</a>
            </li>
            <li>
              <a href="#international">Internacionalização</a>
            </li>
          </ul>
        </Paragraph>
        <Title id="layout" level={2}>
          Layout
        </Title>
        <Paragraph>{div}</Paragraph>
        <Title id="routes" level={2}>
          Rotas
        </Title>
        <Paragraph>{div}</Paragraph>
        <Title id="request" level={2}>
          Requisições
        </Title>
        <Paragraph>{div}</Paragraph>
        <Title id="theme" level={2}>
          Tema
        </Title>
        <Paragraph>{div}</Paragraph>
        <Title id="typescript" level={2}>
          TypeScript
        </Title>
        <Paragraph>{div}</Paragraph>
        <Title id="international" level={2}>
          Internacionalização
        </Title>
        <Paragraph>{div}</Paragraph>
      </Typography>
    </div>
  );
};

export default DocumentationPage;
