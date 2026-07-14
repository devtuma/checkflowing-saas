import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import {
  carregarDadosIniciaisSupabase,
  salvarAtividadesSupabase,
  salvarResponsaveisSupabase,
  salvarOperadoresSupabase,
  salvarCategoriaSupabase,
  excluirCategoriaSupabase,
} from '@/lib/supabaseService';

export const useAppStateManager = () => {
  const [atividades, setAtividades] = useState([]);
  const [responsaveisDisponiveis, setResponsaveisDisponiveis] = useState([]);
  const [manutentores, setManutentores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(null);
  const [atividadeSelecionadaParaManutentor, setAtividadeSelecionadaParaManutentor] = useState(null);
  const [modoAtual, setModoAtual] = useState('selecao');
  const { toast } = useToast();

  const carregarDadosIniciais = useCallback(async () => {
    setCarregandoDados(true);
    setErroCarregamento(null);

    try {
      const { atividadesData, responsaveisData, operadoresData, categoriasData } = await carregarDadosIniciaisSupabase();

      setAtividades(atividadesData);
      setResponsaveisDisponiveis(responsaveisData);
      setManutentores(operadoresData);
      setCategorias(categoriasData);
    } catch (error) {
      logger.error('Erro crítico ao carregar dados iniciais', error, { hook: 'useAppStateManager' });
      const mensagemErro = error.message || 'Erro desconhecido ao carregar dados';
      setErroCarregamento(mensagemErro);
      toast({
        title: "Erro ao Carregar Sistema",
        description: "Não foi possível carregar os dados. Verifique sua conexão e tente novamente.",
        variant: "destructive",
        duration: 10000,
      });
      setAtividades([]);
      setResponsaveisDisponiveis([]);
      setManutentores([]);
      setCategorias([]);
    } finally {
      setCarregandoDados(false);
    }
  }, [toast]);

  const handleSalvarAtividades = useCallback(async (atividadeAtualizada, idParaExcluir = null, eUmaExecucao = false) => {
    try {
      if (eUmaExecucao) {
        setAtividades(prevAtividades =>
          prevAtividades.map(atv => atv.id === atividadeAtualizada.id ? atividadeAtualizada : atv)
        );
      }
      const resultado = await salvarAtividadesSupabase(atividadeAtualizada, idParaExcluir);
      if (!eUmaExecucao) {
        await carregarDadosIniciais();
      }
      if (idParaExcluir) {
        toast({ title: "Sucesso!", description: "Atividade excluída com sucesso!", variant: "success" });
      }
      return resultado;
    } catch (error) {
      logger.error('Erro ao salvar atividades', error, { hook: 'useAppStateManager', idParaExcluir });
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a atividade. Tente novamente.", variant: "destructive", duration: 8000 });
      throw error;
    }
  }, [carregarDadosIniciais, toast]);

  const handleSalvarResponsaveis = useCallback(async (novosResponsaveis) => {
    try {
      const responsaveisSalvos = await salvarResponsaveisSupabase(novosResponsaveis);
      setResponsaveisDisponiveis(responsaveisSalvos);
      toast({ title: "Sucesso!", description: "Responsáveis salvos com sucesso!", variant: "success" });
    } catch (error) {
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar os responsáveis. Tente novamente.", variant: "destructive", duration: 8000 });
      throw error;
    }
  }, [toast]);

  const handleSalvarManutentores = useCallback(async (novosManutentores) => {
    try {
      const manutentoresSalvos = await salvarOperadoresSupabase(novosManutentores);
      setManutentores(manutentoresSalvos);
      toast({ title: "Sucesso!", description: "Manutentores salvos com sucesso!", variant: "success" });
    } catch (error) {
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar os manutentores. Tente novamente.", variant: "destructive", duration: 8000 });
      throw error;
    }
  }, [toast]);

  const handleSalvarCategoria = useCallback(async (categoria) => {
    try {
      const salva = await salvarCategoriaSupabase(categoria);
      setCategorias(prev => {
        const existe = prev.find(c => c.id === salva.id);
        return existe ? prev.map(c => c.id === salva.id ? salva : c) : [...prev, salva];
      });
      toast({ title: "Sucesso!", description: "Categoria salva com sucesso!", variant: "success" });
      return salva;
    } catch (error) {
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a categoria.", variant: "destructive" });
      throw error;
    }
  }, [toast]);

  const handleExcluirCategoria = useCallback(async (id) => {
    try {
      await excluirCategoriaSupabase(id);
      setCategorias(prev => prev.filter(c => c.id !== id));
      toast({ title: "Sucesso!", description: "Categoria excluída.", variant: "success" });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir a categoria.", variant: "destructive" });
      throw error;
    }
  }, [toast]);

  return {
    modoAtual,
    setModoAtual,
    atividades,
    responsaveisDisponiveis,
    manutentores,
    categorias,
    carregandoDados,
    erroCarregamento,
    atividadeSelecionadaParaManutentor,
    setAtividadeSelecionadaParaManutentor,
    handleSalvarAtividades,
    handleSalvarResponsaveis,
    handleSalvarManutentores,
    handleSalvarCategoria,
    handleExcluirCategoria,
    carregarDadosIniciais,
  };
};
