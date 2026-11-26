# Passo a passo para colocar o site no ar (grátis)

## 1. Criar o banco de dados (Firebase, plano grátis)
1. Entre em console.firebase.google.com com sua conta Google e clique em "Criar projeto". Pode desativar o Google Analytics.
2. No menu, abra **Build > Firestore Database > Criar banco de dados**. Escolha a região **southamerica-east1 (São Paulo)** e o modo de produção.
3. Abra **Build > Authentication > Vamos começar > E-mail/senha** e ative.
4. Na aba **Users**, clique em "Adicionar usuário" e crie seu e-mail e senha. Esse será o seu login do painel.
5. Copie o **UID** que aparece na linha do seu usuário.

## 2. Regras de segurança
1. Em **Firestore > Regras**, apague tudo e cole o conteúdo do arquivo `firestore.rules`.
2. Troque `COLE_AQUI_O_SEU_UID` pelo UID copiado e clique em **Publicar**.

Com isso, qualquer pessoa pode ler poemas e enviar avaliações, mas só a sua conta consegue criar, editar ou apagar poemas e perfil.

## 3. Ligar o site ao banco
1. Em **Configurações do projeto (engrenagem) > Geral > Seus apps**, clique no ícone `</>` (Web) e registre um app.
2. Copie os valores `apiKey`, `authDomain`, `projectId` e `appId` para o arquivo `config.js`.

## 4. Publicar de graça
Opção mais fácil: **Netlify**.
1. Crie uma conta grátis em netlify.com.
2. Em "Add new site > Deploy manually", arraste a pasta inteira do site.
3. Você ganha um endereço como `nome.netlify.app`. Pode trocar o nome em Site settings.
4. De volta ao Firebase, em **Authentication > Settings > Domínios autorizados**, adicione esse endereço.

Alternativas grátis: GitHub Pages ou Cloudflare Pages.

## 5. Usar o painel
Acesse `seusite.netlify.app/admin.html`, entre com seu e-mail e senha e edite o perfil, publique poemas e anotações e modere avaliações. Para usar sua foto, envie `foto.jpg` junto com os arquivos e escreva `foto.jpg` no campo de foto.

## 6. Proteção extra (recomendado)
1. No Google Cloud Console (console.cloud.google.com), abra **APIs e serviços > Credenciais**, clique na chave de API do seu projeto e em "Restrições de aplicativo" escolha **Sites**. Adicione o endereço do seu site.
2. Mantenha o arquivo `_headers` na pasta: ele impede que outros sites exibam o seu dentro de um quadro.
3. Não compartilhe sua senha nem o endereço do painel.
