import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CriarAtividade from '@/components/CriarAtividade';
import ListaAtividades from '@/components/ListaAtividades';
import GerenciarResponsaveis from '@/components/GerenciarResponsaveis';
import GerenciarOperadores from '@/components/GerenciarOperadores';
import GerenciarCategorias from '@/components/GerenciarCategorias';
import RelatorioAtividade from '@/components/RelatorioAtividade';
import DialogoAlterarSenhaAdmin from '@/components/DialogoAlterarSenhaAdmin';
import {
  Plus, List, Users, UserCog, LayoutDashboard, LogOut, FileText, Activity, CheckSquare, Users2, Lock, FolderOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

function PainelAdministrador({
  atividades,
  salvarAtividades,
  responsaveisDisponiveis,
  salvarResponsaveis,
  manutentores,
  salvarManutentores,
  categorias,
  salvarCategoria,
  excluirCategoria,
  voltarParaSelecao
}) {
  const [telaAtual, setTelaAtual] = useState('dashboard'); 
  const [atividadeParaEditar, setAtividadeParaEditar] = useState(null);
  const [atividadeParaRelatorio, setAtividadeParaRelatorio] = useState(null);
  const [mostrarModalSenha, setMostrarModalSenha] = useState(false);
  const { toast } = useToast();

  const handleSalvarAtividade = async (dadosAtividade) => {
    try {
      const isEditing = !!atividadeParaEditar?.id;

      const atividadeBase = isEditing 
        ? atividades.find(a => a.id === atividadeParaEditar.id) 
        : {};

      const atividadeFormatada = {
        ...atividadeBase,
        ...dadosAtividade,
        id: atividadeParaEditar?.id, 
      };

      if (!isEditing) {
        atividadeFormatada.status = 'pendente';
        atividadeFormatada.created_at = new Date().toISOString();
        atividadeFormatada.execucoes = [];
        delete atividadeFormatada.id; 
      }
      
      await salvarAtividades(atividadeFormatada, isEditing ? null : undefined, isEditing);
      
      toast({ 
        title: "Sucesso!", 
        description: `Atividade ${isEditing ? 'atualizada' : 'criada'} com sucesso!`, 
        variant: 'success' 
      });
      
      setTelaAtual('listar');
      setAtividadeParaEditar(null);
    } catch (error) {
      console.error('[PainelAdministrador] Erro ao salvar atividade:', error);
      
      toast({ 
        title: "Erro ao Salvar", 
        description: "Ocorreu um erro ao salvar a atividade. Verifique sua conexão e tente novamente.", 
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const handleExcluirAtividade = async (idAtividade) => {
    try {
      await salvarAtividades(null, idAtividade);
    } catch (error) {
      console.error('[PainelAdministrador] Erro ao excluir atividade:', error);
      
      toast({ 
        title: "Erro ao Excluir", 
        description: "Não foi possível excluir a atividade. Tente novamente.", 
        variant: "destructive",
        duration: 8000,
      });
    }
  };
  
  const handleEditarAtividade = (idAtividade) => {
    const atividade = atividades.find(a => a.id === idAtividade);
    if (atividade) {
      if (atividade.status === 'concluida') {
        toast({ 
          title: "Ação não permitida", 
          description: "Não é possível editar uma atividade já concluída.", 
          variant: "warning" 
        });
        return;
      }
      setAtividadeParaEditar(atividade);
      setTelaAtual('criar');
    }
  };

  const copiarAtividade = (idAtividade) => {
    const atividadeOriginal = atividades.find(a => a.id === idAtividade);
    if (!atividadeOriginal) {
      toast({ 
        title: "Erro", 
        description: "Atividade original não encontrada para cópia.", 
        variant: "destructive" 
      });
      return;
    }
    const hoje = new Date().toISOString().split('T')[0];

    const novaAtividadeCopiada = {
      ...atividadeOriginal,
      id: undefined, 
      nome: `${atividadeOriginal.nome} (Cópia)`,
      dataInicio: hoje,
      dataTermino: hoje,
      status: 'pendente',
      created_at: new Date().toISOString(),
      execucoes: [],
      etapas: atividadeOriginal.etapas.map(e => ({...e, imagemExemploArquivo: null}))
    };
    setAtividadeParaEditar(novaAtividadeCopiada); 
    setTelaAtual('criar');
    toast({ title: "Atividade Copiada", description: "Ajuste os dados e salve a nova atividade." });
  };

  const CardEstatistica = ({ titulo, valor, icone, corIcone, descricao }) => (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-card rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col justify-between border border-border/50"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold text-muted-foreground">{titulo}</h4>
          {React.cloneElement(icone, { className: `w-6 h-6 sm:w-8 sm:h-8 ${corIcone}` })}
        </div>
        <p className="text-4xl sm:text-5xl font-extrabold text-foreground">{valor}</p>
      </div>
      <p className="text-sm text-muted-foreground mt-4 font-medium">{descricao}</p>
    </motion.div>
  );
  
  const handleVerRelatorio = (atividade) => {
    setAtividadeParaRelatorio(atividade);
    setTelaAtual('ver_relatorio');
  };

  const renderizarTela = () => {
    if (telaAtual === 'ver_relatorio' && atividadeParaRelatorio) {
      return <RelatorioAtividade atividade={atividadeParaRelatorio} onFechar={() => { setTelaAtual('listar'); setAtividadeParaRelatorio(null);}} />;
    }

    switch (telaAtual) {
      case 'categorias':
        return (
          <GerenciarCategorias
            categorias={categorias || []}
            salvarCategoria={salvarCategoria}
            excluirCategoria={excluirCategoria}
            atividades={atividades}
            onVoltar={() => setTelaAtual('dashboard')}
          />
        );
      case 'criar':
        return (
          <CriarAtividade
            responsaveisDisponiveis={responsaveisDisponiveis}
            categoriasDisponiveis={categorias || []}
            onCriarAtividade={handleSalvarAtividade}
            onVoltar={() => { setTelaAtual('listar'); setAtividadeParaEditar(null); }}
            atividadeInicial={atividadeParaEditar}
          />
        );
      case 'listar':
        return (
          <ListaAtividades 
            atividades={atividades}
            onEditarAtividade={handleEditarAtividade}
            onExcluirAtividade={handleExcluirAtividade}
            onCopiarAtividade={copiarAtividade}
            onVoltar={() => setTelaAtual('dashboard')}
            onVerRelatorio={handleVerRelatorio}
            onNovaAtividade={() => { setAtividadeParaEditar(null); setTelaAtual('criar'); }}
          />
        );
      case 'responsaveis':
        return (
          <GerenciarResponsaveis
            responsaveis={responsaveisDisponiveis}
            salvarResponsaveis={salvarResponsaveis}
            onVoltar={() => setTelaAtual('dashboard')}
          />
        );
      case 'manutentores': 
        return (
          <GerenciarOperadores 
            operadores={manutentores}
            salvarOperadores={salvarManutentores}
            onVoltar={() => setTelaAtual('dashboard')}
          />
        );
      case 'dashboard':
      default:
        const atividadesConcluidas = atividades.filter(a => a.status === 'concluida');
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8" 
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <CardEstatistica titulo="Total de Atividades" valor={atividades.length} icone={<List />} corIcone="text-blue-500" descricao="Atividades cadastradas" />
              <CardEstatistica titulo="Em Andamento" valor={atividades.filter(a => a.status === 'em_andamento').length} icone={<Activity />} corIcone="text-yellow-500" descricao="Atividades em execução" />
              <CardEstatistica titulo="Concluídas" valor={atividadesConcluidas.length} icone={<CheckSquare />} corIcone="text-green-500" descricao="Atividades finalizadas" />
              <CardEstatistica titulo="Manutentores" valor={manutentores.length} icone={<Users2 />} corIcone="text-purple-500" descricao="Usuários cadastrados" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-card rounded-2xl shadow-xl p-6 sm:p-8 border border-border/50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-card-foreground">Atividades Recentes</h3>
                  <Button variant="ghost" size="lg" className="text-base font-semibold" onClick={() => setTelaAtual('listar')}>Ver Todas</Button>
                </div>
                <div className="space-y-4">
                  {atividades.slice(0, 4).map(atv => (
                    <div key={atv.id} className="bg-background border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                      <p className="text-lg font-semibold text-foreground mb-1">{atv.nome}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${atv.status === 'concluida' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : atv.status === 'em_andamento' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                          {atv.status.toUpperCase().replace('_', ' ')}
                        </span>
                        <span>Início: {new Date(atv.dataInicio || atv.data_inicio).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                  {atividades.length === 0 && <div className="text-center py-8 text-muted-foreground font-medium text-lg">Nenhuma atividade cadastrada.</div>}
                </div>
              </div>
              <div className="bg-card rounded-2xl shadow-xl p-6 sm:p-8 border border-border/50">
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-card-foreground">Ações Rápidas</h3>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start text-lg font-semibold min-h-[56px] px-6 rounded-xl hover:bg-accent hover:text-accent-foreground border-border" onClick={() => { setAtividadeParaEditar(null); setTelaAtual('criar');}}>
                    <Plus className="w-6 h-6 mr-3 text-primary" /> Nova Atividade
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-lg font-semibold min-h-[56px] px-6 rounded-xl hover:bg-accent hover:text-accent-foreground border-border" onClick={() => setTelaAtual('manutentores')}>
                    <UserCog className="w-6 h-6 mr-3 text-teal-600" /> Gerenciar Manutentores
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-lg font-semibold min-h-[56px] px-6 rounded-xl hover:bg-accent hover:text-accent-foreground border-border" onClick={() => setTelaAtual('responsaveis')}>
                    <Users className="w-6 h-6 mr-3 text-orange-600" /> Gerenciar Responsáveis
                  </Button>
                   <Button variant="outline" className="w-full justify-start text-lg font-semibold min-h-[56px] px-6 rounded-xl hover:bg-accent hover:text-accent-foreground border-border" onClick={() => setMostrarModalSenha(true)}>
                    <Lock className="w-6 h-6 mr-3 text-red-600" /> Alterar Senha
                  </Button>
                  
                  <h4 className="text-lg font-bold mt-8 pt-6 border-t border-border text-card-foreground">Relatórios de Atividades Concluídas</h4>
                  <div className="space-y-2 mt-4">
                    {atividadesConcluidas.length > 0 ? (
                      atividadesConcluidas.slice(0,3).map(atv => (
                        <Button 
                          key={atv.id} 
                          variant="ghost" 
                          className="w-full justify-start hover:bg-accent/50 text-base font-medium min-h-[48px] px-4 rounded-xl"
                          onClick={() => handleVerRelatorio(atv)}
                        >
                          <FileText className="w-5 h-5 mr-3 text-green-500" /> <span className="truncate">{atv.nome}</span>
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground font-medium px-2">Nenhuma atividade concluída para gerar relatório.</p>
                    )}
                     {atividadesConcluidas.length > 3 && (
                       <Button variant="link" size="lg" onClick={() => setTelaAtual('listar')} className="text-sm font-semibold w-full mt-2">Ver todos os relatórios...</Button>
                     )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/95 backdrop-blur-md shadow-md border-b border-border w-full fixed top-0 left-0 z-50 transition-all"> 
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 lg:px-8 max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-4 md:gap-6 w-full md:w-auto">
             <img src="/logo.png" alt="Mercedes-Benz Logo" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 drop-shadow-sm" />
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-card-foreground text-center md:text-left">Painel Administrativo</h1>
          </div>
          <nav className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-nowrap items-center justify-start gap-2 sm:gap-3 md:gap-4 lg:gap-6 w-full md:w-auto mt-2 md:mt-0 pb-1">
            <Button variant={telaAtual === 'dashboard' ? 'default' : 'outline'} onClick={() => setTelaAtual('dashboard')} className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base font-semibold min-h-[40px] md:min-h-[48px] px-2 sm:px-4 md:px-6 rounded-xl hover:shadow-md transition-all">
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Dashboard</span>
            </Button>
            <Button variant={telaAtual === 'listar' || telaAtual === 'criar' ? 'default' : 'outline'} onClick={() => setTelaAtual('listar')} className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base font-semibold min-h-[40px] md:min-h-[48px] px-2 sm:px-4 md:px-6 rounded-xl hover:shadow-md transition-all">
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Atividades</span>
            </Button>
            <Button variant={telaAtual === 'manutentores' ? 'default' : 'outline'} onClick={() => setTelaAtual('manutentores')} className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base font-semibold min-h-[40px] md:min-h-[48px] px-2 sm:px-4 md:px-6 rounded-xl hover:shadow-md transition-all">
              <UserCog className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Manutentores</span>
            </Button>
            <Button variant={telaAtual === 'categorias' ? 'default' : 'outline'} onClick={() => setTelaAtual('categorias')} className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base font-semibold min-h-[40px] md:min-h-[48px] px-2 sm:px-4 md:px-6 rounded-xl hover:shadow-md transition-all">
              <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Categorias</span>
            </Button>
            <Button variant="destructive" onClick={voltarParaSelecao} className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base font-semibold min-h-[40px] md:min-h-[48px] px-2 sm:px-4 md:px-6 rounded-xl hover:shadow-md transition-all col-span-2 sm:col-span-1">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Sair</span>
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto pt-[260px] sm:pt-[200px] md:pt-[130px] px-2 sm:px-4 md:px-6 max-w-[1600px] pb-12">
        {renderizarTela()}
      </main>
      <DialogoAlterarSenhaAdmin 
        isOpen={mostrarModalSenha}
        onOpenChange={setMostrarModalSenha}
      />
    </div>
  );
}

export default PainelAdministrador;