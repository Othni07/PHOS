export interface ScreenInfo {
  id: string;
  label: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

export interface Platform {
  /** Liste les écrans. Peut renvoyer [] en web sans permission accordée. */
  listScreens(): Promise<ScreenInfo[]>;

  /** Ouvre ou déplace la sortie de projection sur l'écran donné. */
  openProjection(screenId?: string): Promise<void>;

  /** Ferme la sortie de projection. */
  closeProjection(): Promise<void>;

  /** URL à donner à OBS pour l'overlay. */
  overlayUrl(): string;

  /**
   * Charge un fichier de données embarqué (Bible, recueil de cantiques).
   * En phase 2 ce sera une lecture disque ou SQLite : les appelants ne doivent
   * pas savoir lequel, d'où le passage par cette interface plutôt que fetch.
   */
  loadData<T>(name: string): Promise<T>;

  /** Stockage persistant, clé/valeur JSON. */
  store: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
  };
}
