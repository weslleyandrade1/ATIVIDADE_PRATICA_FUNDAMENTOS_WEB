'use strict';

/* ==========================================================
   Site pessoal | Weslley Jessé Andrade da Silva
   1. Ano no rodapé
   2. Imagens opcionais (perfil e projetos)
   3. Diagrama do pipeline (executa as tarefas em sequência)
   4. Menu: destaca a seção que está na tela
   5. Formulário de contato (validação + e-mail pré-preenchido)
   ========================================================== */


/* ---------- 1. Ano no rodapé ---------- */
const elementoAno = document.querySelector('[data-ano]');
if (elementoAno) {
  elementoAno.textContent = new Date().getFullYear();
}


/* ---------- 2. Imagens opcionais ----------
   Se o arquivo de imagem não existir, o bloco recebe a classe
   "sem-imagem" e o visual substituto (iniciais ou texto) aparece. */
document.querySelectorAll('[data-imagem-opcional]').forEach((bloco) => {
  const imagem = bloco.querySelector('img');
  if (!imagem) return;

  const marcarSemImagem = () => bloco.classList.add('sem-imagem');

  // O erro pode ter acontecido antes deste script rodar
  if (imagem.complete && imagem.naturalWidth === 0) marcarSemImagem();
  imagem.addEventListener('error', marcarSemImagem);
});


/* ---------- 3. Diagrama do pipeline ---------- */
(function iniciarDiagrama() {
  const diagrama = document.querySelector('[data-dag]');
  if (!diagrama) return;

  const tarefas = Array.from(diagrama.querySelectorAll('.tarefa'));
  const arestas = Array.from(diagrama.querySelectorAll('.aresta'));
  const status = diagrama.querySelector('[data-dag-status]');
  const botao = diagrama.querySelector('[data-dag-repetir]');

  const totalEtapas = 5;
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

  function definirEstado(tarefa, estado) {
    tarefa.classList.remove('executando', 'sucesso');
    if (estado !== 'pendente') tarefa.classList.add(estado);
  }

  function mostrarStatus(estado, texto) {
    status.dataset.estado = estado;
    status.textContent = texto;
  }

  function reiniciar() {
    tarefas.forEach((tarefa) => definirEstado(tarefa, 'pendente'));
    arestas.forEach((aresta) => aresta.classList.remove('ativa'));
  }

  function concluirTudo() {
    tarefas.forEach((tarefa) => definirEstado(tarefa, 'sucesso'));
    arestas.forEach((aresta) => aresta.classList.add('ativa'));
    mostrarStatus('sucesso', 'Sucesso');
  }

  let rodando = false;

  async function executar() {
    if (rodando) return;
    rodando = true;
    if (botao) botao.disabled = true;

    reiniciar();
    mostrarStatus('executando', 'Executando');
    await pausa(300);

    for (let etapa = 1; etapa <= totalEtapas; etapa++) {
      const daEtapa = tarefas.filter((t) => Number(t.dataset.etapa) === etapa);

      daEtapa.forEach((t) => definirEstado(t, 'executando'));
      await pausa(850);
      daEtapa.forEach((t) => definirEstado(t, 'sucesso'));

      arestas
        .filter((a) => Number(a.dataset.de) === etapa)
        .forEach((a) => a.classList.add('ativa'));
    }

    mostrarStatus('sucesso', 'Sucesso');
    if (botao) botao.disabled = false;
    rodando = false;
  }

  if (botao) botao.addEventListener('click', executar);

  // Quem prefere menos movimento vê o diagrama já concluído
  if (reduzMovimento) {
    concluirTudo();
  } else if (document.readyState === 'complete') {
    setTimeout(executar, 400);
  } else {
    window.addEventListener('load', () => setTimeout(executar, 400));
  }
})();


/* ---------- 4. Menu: seção ativa ---------- */
(function marcarMenu() {
  const links = Array.from(document.querySelectorAll('.menu a'));
  const secoes = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!secoes.length) return;

  function ativar(id) {
    links.forEach((link) => {
      if (link.getAttribute('href') === '#' + id) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if ('IntersectionObserver' in window) {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) ativar(entrada.target.id);
      });
    }, { rootMargin: '-35% 0px -55% 0px' });

    secoes.forEach((secao) => observador.observe(secao));
  }

  // A última seção é curta: ao chegar no fim da página, ela é a ativa
  window.addEventListener('scroll', () => {
    const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (noFim) ativar(secoes[secoes.length - 1].id);
  }, { passive: true });
})();


/* ---------- 5. Formulário de contato ----------
   O GitHub Pages não tem servidor para receber formulários.
   Por isso, depois de validar, abrimos o aplicativo de e-mail
   do visitante com a mensagem já preenchida.
   (Alternativa com envio direto: serviços como Formspree.) */
(function iniciarFormulario() {
  const formulario = document.querySelector('#form-contato');
  if (!formulario) return;

  const DESTINO = 'wesleyandradejp2@gmail.com';
  const status = formulario.querySelector('[data-form-status]');

  // A validação é feita aqui, com mensagens em português
  formulario.noValidate = true;

  const regras = {
    nome: (valor) => valor.trim().length >= 3 || 'Informe seu nome completo.',
    email: (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())
      || 'Informe um e-mail válido, como nome@dominio.com.',
    assunto: (valor) => valor.trim().length >= 3 || 'Informe o assunto da mensagem.',
    mensagem: (valor) => valor.trim().length >= 10 || 'Escreva ao menos 10 caracteres na mensagem.'
  };

  function validar(campo) {
    const regra = regras[campo.name];
    if (!regra) return true;

    const resultado = regra(campo.value);
    const valido = resultado === true;
    const areaErro = formulario.querySelector('#erro-' + campo.name);

    campo.setAttribute('aria-invalid', String(!valido));
    if (areaErro) areaErro.textContent = valido ? '' : resultado;
    return valido;
  }

  const campos = Array.from(formulario.querySelectorAll('input, textarea'));

  campos.forEach((campo) => {
    campo.addEventListener('blur', () => validar(campo));
    campo.addEventListener('input', () => {
      if (campo.getAttribute('aria-invalid') === 'true') validar(campo);
    });
  });

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    status.className = 'form-status';
    status.textContent = '';

    const invalidos = campos.filter((campo) => !validar(campo));
    if (invalidos.length > 0) {
      invalidos[0].focus();
      status.textContent = 'Corrija os campos destacados e envie de novo.';
      status.classList.add('form-status-erro');
      return;
    }

    const dados = new FormData(formulario);
    const nome = String(dados.get('nome')).trim();
    const email = String(dados.get('email')).trim();
    const assunto = String(dados.get('assunto')).trim();
    const mensagem = String(dados.get('mensagem')).trim();

    const corpo = `${mensagem}\n\n${nome}\n${email}`;
    const endereco = `mailto:${DESTINO}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;

    window.location.href = endereco;

    status.textContent = 'Abrimos o seu aplicativo de e-mail com a mensagem pronta. Falta só enviar por lá.';
    status.classList.add('form-status-ok');
  });
})();
