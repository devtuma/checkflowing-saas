import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rzlcwlmhhgmowibsmdhj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bGN3bG1oaGdtb3dpYnNtZGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjI1ODcsImV4cCI6MjA4OTE5ODU4N30.2k2ziDCrwt3DkbZdgBndolAPDkio-8ZnMY1VAbbWESE'
);

const operadores = [
  { nome: 'ALAN DE ALMEIDA SANTOS SANTANA',    re: '2813157', id_mercedes: 'ALSANTA', primeiro_acesso: true },
  { nome: 'ALAN REIS DO AMARAL',                re: '2828375', id_mercedes: 'ALAAMAR', primeiro_acesso: true },
  { nome: 'ALESSANDRO MIQUELIN',                re: '2909979', id_mercedes: 'ALMIQUE', primeiro_acesso: true },
  { nome: 'ANDERSON PASSONI PINHEIRO',          re: '2826313', id_mercedes: 'ANDPINH', primeiro_acesso: true },
  { nome: 'ANDRE TOLA',                         re: '2814552', id_mercedes: 'ANTOLA',  primeiro_acesso: true },
  { nome: 'ANTONIO LUCENA DE ARAUJO',           re: '2788357', id_mercedes: 'ARAUJAN', primeiro_acesso: true },
  { nome: 'BATISTA SILVERIO DA SILVA JUNIOR',   re: '2838710', id_mercedes: 'BSILVAJ', primeiro_acesso: true },
  { nome: 'CARLOS RENATO GOMES',                re: '2894076', id_mercedes: 'GOMCAR',  primeiro_acesso: true },
  { nome: 'DANILO DE OLIVEIRA GOMES',           re: '2869730', id_mercedes: 'GOMESDA', primeiro_acesso: true },
  { nome: 'DIEGO MICHEL COSTA DE SOUZA',        re: '2918528', id_mercedes: 'SOUZDIE', primeiro_acesso: true },
  { nome: 'ELIANDERSON COSTA DE SOUZA SOLANO',  re: '2900556', id_mercedes: 'SOLANOE', primeiro_acesso: true },
  { nome: 'ELIEZER ROSA CORREA',                re: '5014000', id_mercedes: 'ELICORR', primeiro_acesso: true },
  { nome: 'EVANDRO MULLER',                     re: '2732360', id_mercedes: 'EVMULLE', primeiro_acesso: true },
  { nome: 'FABIANO ROBERTO DAMICO',             re: '2819104', id_mercedes: 'FADAMIC', primeiro_acesso: true },
  { nome: 'FABRICIO COSTA DOS SANTOS',          re: '2943468', id_mercedes: 'FABRISA', primeiro_acesso: true },
  { nome: 'FERNANDO BEZERRA SOUSA SILVA',       re: '2939584', id_mercedes: 'FERNAS1', primeiro_acesso: true },
  { nome: 'FRANCISCO VAGNER COSTA BEZERRA',     re: '2871513', id_mercedes: 'BEZERRF', primeiro_acesso: true },
  { nome: 'HERNANE FELICIO',                    re: '2824256', id_mercedes: 'HFELICI', primeiro_acesso: true },
  { nome: 'HUGO SANTANA DA SILVA',              re: '2817411', id_mercedes: 'HUGSILV', primeiro_acesso: true },
  { nome: 'ISRAEL MANZONI SOUZA',               re: '2830183', id_mercedes: 'ISOUZA1', primeiro_acesso: true },
  { nome: 'JEFFERSON DA SILVA GOMES',           re: '2945720', id_mercedes: 'GOMESJE', primeiro_acesso: true },
  { nome: 'JOAO VIEIRA DA SILVA',               re: '2821540', id_mercedes: 'JOAOVSI', primeiro_acesso: true },
  { nome: 'JOSE ANTONIO DA SILVA',              re: '2825490', id_mercedes: 'JOSIL22', primeiro_acesso: true },
  { nome: 'LUCIANO FELIX DE MORAIS',            re: '2830876', id_mercedes: 'LUCMORA', primeiro_acesso: true },
  { nome: 'MAICON SANTOS BRANDAO',              re: '2869446', id_mercedes: 'BRANMAI', primeiro_acesso: true },
  { nome: 'MARCELO GUIMARAES DE SOUZA',         re: '2872056', id_mercedes: 'SOUZAM',  primeiro_acesso: true },
  { nome: 'NELSON ROCHA DE CARVALHO',           re: '2809494', id_mercedes: 'NECARVA', primeiro_acesso: true },
  { nome: 'NILSON IHA',                         re: '2855348', id_mercedes: 'NILSIHA', primeiro_acesso: true },
  { nome: 'RENATO TREVIZAN',                    re: '2842475', id_mercedes: 'RTREVIZ', primeiro_acesso: true },
  { nome: 'RILMAR RAFAEL TEIXEIRA',             re: '2816024', id_mercedes: 'RITEIXE', primeiro_acesso: true },
  { nome: 'ROGERIO VOGEL',                      re: '5016908', id_mercedes: 'ROGVOGE', primeiro_acesso: true },
  { nome: 'SIDNEI RAMON ALVES DOS SANTOS',      re: '2935570', id_mercedes: 'SANTSID', primeiro_acesso: true },
  { nome: 'THIAGO FERNANDES FERREIRA',          re: '2791307', id_mercedes: 'THFERRE', primeiro_acesso: true },
  { nome: 'THIAGO GERARDO',                     re: '2791650', id_mercedes: 'THIGERA', primeiro_acesso: true },
  { nome: 'VALDY PEREIRA DO NASCIMENTO',        re: '2831392', id_mercedes: 'VANASCI', primeiro_acesso: true },
  { nome: 'VALTEMI ARAUJO FERREIRA',            re: '2765829', id_mercedes: 'VALTFER', primeiro_acesso: true },
];

// Limpar tabela antes de reinserir
console.log('Limpando registros existentes...');
const { error: deleteError } = await supabase
  .from('operadores')
  .delete()
  .not('id', 'is', null); // deleta todos os registros

if (deleteError) {
  console.error('ERRO ao limpar:', deleteError.message);
  process.exit(1);
}
console.log('Tabela limpa. Inserindo novos registros...\n');

console.log(`Inserindo ${operadores.length} operadores...`);

const { data, error } = await supabase
  .from('operadores')
  .insert(operadores)
  .select();

if (error) {
  console.error('ERRO:', error.message);
  console.error('Detalhes:', error.details);
  process.exit(1);
}

console.log(`\n✅ ${data.length} operadores inseridos com sucesso!\n`);
data.forEach((op, i) => {
  console.log(`  ${String(i+1).padStart(2,'0')}. ${op.nome} | RE: ${op.re} | ID: ${op.id_mercedes}`);
});
