#!/bin/bash

while true; do
    read -p "Deseja atualizar os arquivos locais do computador usando os arquivos do GitHub? (S/N): " resp_pull
    case "$resp_pull" in
        [Ss]) 
            echo "Baixando atualizações do GitHub..."
            git pull https://github.com/Walter-Henri/CAD.git main
            break
            ;;
        [Nn]) 
            echo "Pulando atualização local."
            break
            ;;
        *) 
            echo "Resposta inválida! Digite S ou N."
            ;;
    esac
done

echo ""

while true; do
    read -p "Deseja atualizar os arquivos do repositório do GitHub usando os arquivos locais? (S/N): " resp_push
    case "$resp_push" in
        [Ss])
            while true; do
                echo ""
                read -p "Digite a mensagem do que você modificou: " msg
                
                while true; do
                    read -p "A mensagem está correta? [$msg] (S/N): " conf_msg
                    case "$conf_msg" in
                        [Ss])
                            echo "Enviando arquivos locais para o GitHub..."
                            git add .
                            git commit -m "$msg"
                            git push https://github.com/Walter-Henri/CAD.git main
                            break 3 # Sai de todos os laços de envio
                            ;;
                        [Nn])
                            echo "Voltando para reescrever a mensagem..."
                            break # Sai da confirmação e volta para o input da mensagem
                            ;;
                        *)
                            echo "Resposta inválida! Digite S ou N."
                            ;;
                    esac
                done
            done
            ;;
        [Nn])
            echo "Processo finalizado sem enviar alterações."
            break
            ;;
        *)
            echo "Resposta inválida! Digite S ou N."
            ;;
    esac
done
