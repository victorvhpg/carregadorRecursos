carregadorRecursos
==================

carregador de recursos (imagens, audio, json) para aplicações que precisam ter controle do carregamento dos recursos utilizados, por exemplo controle dos recursos de um games


exemplo de uso :

             carregadorRecursos.carregar({
                    forcarCarregamento: true,
                    imagens: [
                        "http://www.ibm.com/developerworks/java/library/j-html5-game6/jump-sequence-natural.jpg?teste=123&oi=google",
                        "http://www.ibm.com/developerworks/java/library/j-html5-game6/runner-tracks.jpg",
                        "http://www.w3.org/2008/site/images/logo-w3c-screen-lg"
                    ],
                    audio: [
                        "audio/FF7_ac_angel.ogg",
                        "audio/FF7_ost_main.ogg",
                        "audio/Final_Fantasy_XIII-2_-_Lightning's_Theme.ogg",
                        "audio/Super_Mario_Bros._theme.ogg",
                        "audio/1-up.wav"],
                    json: [
                        "mapas/fase1.json",
                        "mapas/fase1ModoEasy.json"
                    ]

                }, {
                    onAoCarregarUmRecurso: function(percCompleto, srcItemRecurso, carregouComSucesso) {
                        console.log("recursos carregados: " + percCompleto
                                + "% - atual: " + srcItemRecurso + " , sucesso: "
                                + ((carregouComSucesso) ? "SIM" : "NAO"));
                    },
                    onCarregouTodos: function(tempoTotalParaCarregar, carregouTodosComSucesso) {
                        console.log("CARREGOU TODOS RECURSOS em " + tempoTotalParaCarregar + "ms   SITUACAO:" + ((carregouTodosComSucesso) ? "SUCESSO" : "ERRO"));
                        var mapa = recursosCache.get("mapas/fase1.json");
                        var som1 = recursosCache.get("audio/FF7_ac_angel.ogg");
                        var img1 = recursosCache.get("http://www.ibm.com/developerworks/java/library/j-html5-game6/runner-tracks.jpg");
                    }
                });
