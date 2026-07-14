import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  Footer,
  BorderStyle,
} from "docx";
import { supabase } from '@/lib/supabaseClient';
import { CONFIG } from '@/config/empresa';

const fetchImageAsArrayBuffer = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error) {
    console.error("Failed to fetch image for Word export:", error);
    return null;
  }
};

const createHeading = (text, level = HeadingLevel.HEADING_1) => {
  return new Paragraph({
    text: text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
};

const createInfoRow = (label, value) => {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value ? String(value) : "N/A" }),
    ],
    spacing: { after: 60 },
  });
};

export const generateWordDocument = async (atividade) => {
  const children = [];

  // Fetch Operators for mapping
  let operadores = [];
  try {
    const { data } = await supabase.from('operadores').select('re, nome');
    if (data) operadores = data;
  } catch (error) {
    console.error("Failed to fetch operators:", error);
  }

  const formatRE = (re) => {
    if (!re) return "N/A";
    const op = operadores.find(o => String(o.re) === String(re));
    return op ? `${re} - ${op.nome}` : String(re);
  };

  // Header / Title
  children.push(
    new Paragraph({
      text: `${CONFIG.nomeEmpresa} - ${CONFIG.nomeSistema}`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  children.push(createHeading("Relatório da Atividade", HeadingLevel.HEADING_1));

  // Info Table
  const statusText = atividade.status === 'concluida' ? 'Concluída' : (atividade.status === 'em_andamento' ? 'Em Andamento' : 'Pendente');
  
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Atividade", bold: true })] })], padding: { top: 100, bottom: 100, left: 100, right: 100 } }),
            new TableCell({ children: [new Paragraph(atividade.nome)], padding: { top: 100, bottom: 100, left: 100, right: 100 } }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })], padding: { top: 100, bottom: 100, left: 100, right: 100 } }),
            new TableCell({ children: [new Paragraph(statusText)], padding: { top: 100, bottom: 100, left: 100, right: 100 } }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Data Início", bold: true })] })], padding: { top: 100, bottom: 100, left: 100, right: 100 } }),
            new TableCell({ children: [new Paragraph(new Date(atividade.dataInicio || atividade.datainicio).toLocaleDateString('pt-BR'))], padding: { top: 100, bottom: 100, left: 100, right: 100 } }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Data Término", bold: true })] })], padding: { top: 100, bottom: 100, left: 100, right: 100 } }),
            new TableCell({ children: [new Paragraph(new Date(atividade.dataTermino || atividade.datatermino).toLocaleDateString('pt-BR'))], padding: { top: 100, bottom: 100, left: 100, right: 100 } }),
          ],
        }),
      ],
    })
  );

  // Execuções (Histórico Completo)
  if (atividade.execucoes && atividade.execucoes.length > 0) {
    children.push(createHeading("Histórico de Execuções (Completo)", HeadingLevel.HEADING_2));
    
    atividade.execucoes.forEach((execucao, index) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Execução ${index + 1} - RE: ${formatRE(execucao.numeroRE)}`, bold: true, size: 24 })],
        spacing: { before: 200, after: 100 }
      }));
      
      children.push(createInfoRow("Iniciado em", new Date(execucao.iniciadoEm).toLocaleString('pt-BR')));
      children.push(createInfoRow("Finalizado em", execucao.finalizadoEm ? new Date(execucao.finalizadoEm).toLocaleString('pt-BR') : "Em andamento"));
      
      children.push(new Paragraph({
        text: "Detalhamento das Etapas desta execução:",
        italics: true,
        spacing: { before: 100, after: 100 }
      }));

      // Await processing of steps and images done below if it was the last execution, but not mapped inline here for all.
    });
  }

  // Detalhamento da Última Execução (Com Imagens)
  const ultimaExecucao = atividade.execucoes?.find(e => !e.finalizadoEm) || atividade.execucoes?.[atividade.execucoes.length - 1];
  
  if (ultimaExecucao) {
    children.push(createHeading("Detalhamento da Última Execução", HeadingLevel.HEADING_2));

    for (const [index, etapa] of ultimaExecucao.etapas.entries()) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Etapa ${index + 1}: ${etapa.descricao}`, bold: true, size: 22 })],
        spacing: { before: 240, after: 100 }
      }));

      children.push(createInfoRow("Status", etapa.concluida ? "Concluída" : "Pendente"));
      children.push(createInfoRow("Responsáveis (Área)", etapa.responsaveis?.join(', ') || "N/A"));

      if (etapa.concluida) {
        children.push(createInfoRow("Executado por", formatRE(etapa.responsavelExecucao)));
        children.push(createInfoRow("Data de Conclusão", new Date(etapa.dataExecucao).toLocaleString('pt-BR')));
      }

      if (etapa.observacoes) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: "Observações: ", bold: true }),
            new TextRun({ text: etapa.observacoes })
          ],
          spacing: { after: 100 }
        }));
      }

      // Handle Images
      const imageParagraphs = [];
      
      if (etapa.imagemExemploUrl) {
        const imgBuffer = await fetchImageAsArrayBuffer(etapa.imagemExemploUrl);
        if (imgBuffer) {
          imageParagraphs.push(
            new Paragraph({ text: "Imagem de Exemplo (Admin):", italics: true, spacing: { before: 100 } }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: imgBuffer,
                  transformation: { width: 300, height: 225 }, // Adjust aspect ratio roughly
                })
              ],
              spacing: { after: 100 }
            })
          );
        }
      }

      if (etapa.imagemUsuarioUrl) {
        const imgBuffer = await fetchImageAsArrayBuffer(etapa.imagemUsuarioUrl);
        if (imgBuffer) {
          imageParagraphs.push(
            new Paragraph({ text: "Imagem do Operador:", italics: true, spacing: { before: 100 } }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: imgBuffer,
                  transformation: { width: 300, height: 225 },
                })
              ],
              spacing: { after: 100 }
            })
          );
        }
      }

      if (imageParagraphs.length > 0) {
        children.push(...imageParagraphs);
      }
      
      // Separator
      children.push(new Paragraph({
        text: "--------------------------------------------------",
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 }
      }));
    }
  }

  const doc = new Document({
    creator: CONFIG.nomeSistema,
    title: `Relatório - ${atividade.nome}`,
    sections: [
      {
        properties: {},
        headers: {
          default: undefined,
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun(`Documento gerado em ${new Date().toLocaleString('pt-BR')} via ${CONFIG.nomeSistema} - ${CONFIG.nomeEmpresa}`),
                ],
              }),
            ],
          }),
        },
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Relatorio_${atividade.nome.replace(/\s+/g, '_').toLowerCase()}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};