@echo off
:: Configura o prompt para aceitar caracteres especiais e acentos se necessário
chcp 65001 > nul

:PERGUNTA_PULL
set /p resp_pull="Deseja atualizar os arquivos locais do computador usando os arquivos do GitHub? (S/N): "
if /i "%resp_pull%"=="S" (
    echo Baixando atualizações do GitHub...
    git pull https://github.com/Walter-Henri/CAD.git main
) else if /i "%resp_pull%"=="N" (
    echo Pulando atualização local.
) else (
    echo Resposta inválida! Digite S ou N.
    goto PERGUNTA_PULL
)

echo.

:PERGUNTA_PUSH
set /p resp_push="Deseja atualizar os arquivos do repositório do GitHub usando os arquivos locais? (S/N): "
if /i "%resp_push%"=="S" (
    goto COLETAR_MENSAGEM
) else if /i "%resp_push%"=="N" (
    echo Processo finalizado sem enviar alterações.
    goto FIM
) else (
    echo Resposta inválida! Digite S ou N.
    goto PERGUNTA_PUSH
)

:COLETAR_MENSAGEM
echo.
set /p msg="Digite a mensagem do que você modificou: "

:CONFIRMA_MENSAGEM
set /p conf_msg="A mensagem está correta? [%msg%] (S/N): "
if /i "%conf_msg%"=="N" (
    echo Voltando para reescrever a mensagem...
    goto COLETAR_MENSAGEM
) else if /i "%conf_msg%"=="S" (
    echo Enviando arquivos locais para o GitHub...
    git add .
    git commit -m "%msg%"
    git push https://github.com/Walter-Henri/CAD.git main
) else (
    echo Resposta inválida! Digite S ou N.
    goto CONFIRMA_MENSAGEM
)

:FIM
pause
