"use client"
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon } from '@heroicons/react/24/outline';

type Categoria = "Pessoal" | "Trabalho" | "Estudos";

type Tarefa = {
  texto: string;
  concluida: boolean;
  categoria: Categoria;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1 
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 }
  }
};

export default function PaginaHome() {
  const [tarefa, setTarefa] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Pessoal");
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [erro, setErro] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  // Carrega tarefas do localStorage ao iniciar
  useEffect(() => {
    const tarefasSalvas = localStorage.getItem("tarefas");
    if (tarefasSalvas) {
      setTarefas(JSON.parse(tarefasSalvas));
    }
  }, []);

  // Salva tarefas no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("tarefas", JSON.stringify(tarefas));
  }, [tarefas]);

  function adicionarTarefa() {
    if (tarefa.trim() === "") {
      setErro("Digite uma tarefa!");
      return;
    }
    if (tarefas.some(t => t.texto === tarefa.trim() && t.categoria === categoria)) {
      setErro("Tarefa já existe nesta categoria!");
      return;
    }
    setTarefas([...tarefas, { texto: tarefa.trim(), concluida: false, categoria }]);
    setTarefa("");
    setErro("");
    setConfirmacao("Tarefa adicionada com sucesso!");
    setTimeout(() => setConfirmacao(""), 2000);
  }

  function removerTarefa(index: number) {
    setTarefas(tarefas.filter((_, i) => i !== index));
  }

  function alternarConcluida(index: number) {
    setTarefas(tarefas.map((t, i) =>
      i === index ? { ...t, concluida: !t.concluida } : t
    ));
    if (!tarefas[index].concluida) {
      setConfirmacao("Tarefa concluída com sucesso!");
      setTimeout(() => setConfirmacao(""), 2000);
    }
  }

  return (
    <motion.div
      className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
    >
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Minhas Tarefas</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie suas tarefas diárias</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-grow">
            <input
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
              placeholder="Digite sua tarefa"
              value={tarefa}
              onChange={e => setTarefa(e.target.value)}
              onKeyDown={e => e.key === "Enter" && adicionarTarefa()}
            />
          </div>

          <select
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600"
            value={categoria}
            onChange={e => setCategoria(e.target.value as Categoria)}
          >
            <option value="Pessoal">Pessoal</option>
            <option value="Trabalho">Trabalho</option>
            <option value="Estudos">Estudos</option>
          </select>

          <motion.button
            className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={adicionarTarefa}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <PlusIcon className="h-5 w-5" />
            <span>Adicionar</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {erro && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            >
              {erro}
            </motion.div>
          )}
          {confirmacao && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            >
              {confirmacao}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-gray-600 dark:text-gray-400 mb-4">
          Total: {tarefas.length} {tarefas.length === 1 ? "tarefa" : "tarefas"}
        </div>

        <ul className="space-y-2">
          {tarefas.length === 0 ? (
            <li className="text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhuma tarefa adicionada.
            </li>
          ) : (
            tarefas.map((t, i) => (
              <motion.li
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span
                    onClick={() => alternarConcluida(i)}
                    className={`cursor-pointer select-none text-gray-800 dark:text-gray-200 ${
                      t.concluida ? "line-through text-gray-400 dark:text-gray-500" : ""
                    }`}
                  >
                    {t.texto}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    {t.categoria}
                  </span>
                </div>
                <motion.button
                  onClick={() => removerTarefa(i)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700 transition font-bold"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  Excluir
                </motion.button>
              </motion.li>
            ))
          )}
        </ul>
      </motion.div>
    </motion.div>
  );
}