#!/bin/bash
# Lanceur double-clic pour macOS — équivalent de Demarrer.cmd sous Windows.
# Laisser cette fenêtre ouverte pendant tout le culte : la fermer coupe la
# projection et l'incrustation OBS.
#
# Si le double-clic ne fait rien, le droit d'exécution manque. Une seule fois :
#   chmod +x Demarrer.command

# Le double-clic ouvre le Terminal dans le dossier personnel, pas dans celui du
# projet : on se replace là où vit ce fichier.
cd "$(dirname "$0")" || exit 1

printf '\033]0;Projecteur - serveur (ne pas fermer)\007'

echo
echo "  Projecteur"
echo "  ----------"
echo "  Régie       : http://localhost:5173/console"
echo "  Projection  : http://localhost:5173/projection"
echo "  Overlay OBS : http://localhost:5173/overlay"
echo
echo "  Fermer cette fenêtre arrête la projection."
echo

# Node absent est la panne la plus probable sur une machine neuve : le dire
# clairement vaut mieux que « command not found » au milieu de l'écran.
if ! command -v npm >/dev/null 2>&1; then
  echo "  Node.js n'est pas installé."
  echo "  Installez la version LTS depuis https://nodejs.org puis relancez."
  echo
  read -r -p "  Appuyez sur Entrée pour fermer. "
  exit 1
fi

# Le dossier arrive souvent sans node_modules (clé USB, clone frais) : les
# dépendances sont propres à la machine et doivent être installées sur place.
if [ ! -d node_modules ]; then
  echo "  Première utilisation : installation des dépendances…"
  echo
  if ! npm install; then
    echo
    echo "  L'installation a échoué. Le message ci-dessus en donne la raison."
    read -r -p "  Appuyez sur Entrée pour fermer. "
    exit 1
  fi
  echo
fi

# Le navigateur s'ouvre quand le serveur répond vraiment, pas après un délai
# fixe : une installation lente ouvrirait sinon une page d'erreur.
# Chrome est préféré à Safari, seul lui sait désigner l'écran du vidéoprojecteur.
(
  for _ in $(seq 1 60); do
    if curl -s -o /dev/null "http://localhost:5173/console"; then
      open -a "Google Chrome" "http://localhost:5173/console" 2>/dev/null ||
        open "http://localhost:5173/console"
      exit 0
    fi
    sleep 1
  done
) &

npm run dev

# Si on arrive ici, le serveur s'est arrêté : garder la fenêtre ouverte pour que
# le message d'erreur reste lisible.
echo
echo "  Le serveur s'est arrêté."
read -r -p "  Appuyez sur Entrée pour fermer. "
