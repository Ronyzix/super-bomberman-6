// Story Manager - Handles narrative, dialogues, and cutscenes

export interface DialogueLine {
  speaker: string;
  text: string;
  emotion?: 'normal' | 'angry' | 'sad' | 'happy' | 'surprised' | 'determined';
}

export interface Cutscene {
  id: string;
  title: string;
  dialogues: DialogueLine[];
  background?: string;
  music?: string;
}

export interface WorldStory {
  worldId: number;
  name: string;
  description: string;
  intro: Cutscene;
  bossIntro: Cutscene;
  bossDefeat: Cutscene;
}

// Main story narrative
export const GAME_STORY = {
  title: "Super Bomberman 6: The Shadow Invasion",
  
  prologue: {
    id: 'prologue',
    title: 'A New Threat',
    dialogues: [
      { speaker: 'Narrator', text: 'In the peaceful Bomber Kingdom, a dark shadow has emerged...' },
      { speaker: 'Narrator', text: 'The ancient Demon King, sealed away for a thousand years, has broken free.' },
      { speaker: 'Bomberman', text: 'I sense a great disturbance. Something terrible is coming!', emotion: 'surprised' as const },
      { speaker: 'Elder', text: 'Bomberman, the seals across the five realms have been broken.' },
      { speaker: 'Elder', text: 'You must travel through each world and defeat the guardians corrupted by darkness.' },
      { speaker: 'Bomberman', text: 'I won\'t let the kingdom fall! I\'ll stop this invasion!', emotion: 'determined' as const },
      { speaker: 'Elder', text: 'Be careful, young hero. The Demon King\'s power grows with each passing moment.' },
      { speaker: 'Narrator', text: 'And so, Bomberman\'s greatest adventure begins...' },
    ],
  } as Cutscene,
  
  epilogue: {
    id: 'epilogue',
    title: 'Peace Restored',
    dialogues: [
      { speaker: 'Narrator', text: 'With the Demon King defeated, light returns to the Bomber Kingdom.' },
      { speaker: 'Bomberman', text: 'It\'s finally over... The kingdom is safe.', emotion: 'happy' as const },
      { speaker: 'Elder', text: 'You have done what no hero has done in a thousand years.' },
      { speaker: 'Elder', text: 'The five realms are free from corruption, and peace reigns once more.' },
      { speaker: 'Bomberman', text: 'I couldn\'t have done it without my friends.', emotion: 'happy' as const },
      { speaker: 'Narrator', text: 'The legend of Bomberman will be told for generations to come.' },
      { speaker: 'Narrator', text: 'But in the shadows, a new threat stirs...' },
      { speaker: 'Narrator', text: 'THE END... ?' },
    ],
  } as Cutscene,
};

export const WORLD_STORIES: WorldStory[] = [
  {
    worldId: 1,
    name: 'Green Gardens',
    description: 'A peaceful forest corrupted by dark slimes',
    intro: {
      id: 'world1_intro',
      title: 'The Corrupted Forest',
      dialogues: [
        { speaker: 'Narrator', text: 'The once-beautiful Green Gardens have been overrun by slimes.' },
        { speaker: 'Bomberman', text: 'This forest used to be so peaceful...', emotion: 'sad' as const },
        { speaker: 'Forest Spirit', text: 'Hero! The King Slime has corrupted our home!' },
        { speaker: 'Forest Spirit', text: 'Please, you must defeat him and restore the forest!' },
        { speaker: 'Bomberman', text: 'Don\'t worry, I\'ll save the Green Gardens!', emotion: 'determined' as const },
      ],
    },
    bossIntro: {
      id: 'world1_boss_intro',
      title: 'King Slime Awakens',
      dialogues: [
        { speaker: 'King Slime', text: 'GRRROOOAR! Who dares enter my domain?!', emotion: 'angry' as const },
        { speaker: 'Bomberman', text: 'I\'m here to stop your corruption!', emotion: 'determined' as const },
        { speaker: 'King Slime', text: 'Foolish bomber! I\'ll absorb you into my mass!' },
        { speaker: 'King Slime', text: 'The Demon King gave me this power! You cannot defeat me!' },
        { speaker: 'Bomberman', text: 'We\'ll see about that!', emotion: 'determined' as const },
      ],
    },
    bossDefeat: {
      id: 'world1_boss_defeat',
      title: 'Forest Restored',
      dialogues: [
        { speaker: 'King Slime', text: 'Impossible... How could I lose...?', emotion: 'surprised' as const },
        { speaker: 'Bomberman', text: 'Your corruption ends here!' },
        { speaker: 'Forest Spirit', text: 'Thank you, hero! The forest is healing!' },
        { speaker: 'Forest Spirit', text: 'But beware... The next realm holds greater dangers.' },
        { speaker: 'Bomberman', text: 'I\'ll face whatever comes. Onward to the Crystal Caves!' },
      ],
    },
  },
  {
    worldId: 2,
    name: 'Crystal Caves',
    description: 'Underground caverns filled with dangerous creatures',
    intro: {
      id: 'world2_intro',
      title: 'Into the Depths',
      dialogues: [
        { speaker: 'Narrator', text: 'Deep beneath the mountains lie the Crystal Caves.' },
        { speaker: 'Bomberman', text: 'It\'s so dark down here... I can barely see.', emotion: 'surprised' as const },
        { speaker: 'Cave Dweller', text: 'Stranger! The Dark Knight has taken over our home!' },
        { speaker: 'Cave Dweller', text: 'He commands an army of bats and ghosts!' },
        { speaker: 'Bomberman', text: 'A knight corrupted by darkness... I must stop him!' },
      ],
    },
    bossIntro: {
      id: 'world2_boss_intro',
      title: 'The Dark Knight',
      dialogues: [
        { speaker: 'Dark Knight', text: 'So, you\'re the bomber who defeated King Slime.' },
        { speaker: 'Bomberman', text: 'Release these caves from your control!' },
        { speaker: 'Dark Knight', text: 'I was once a protector of these caves...' },
        { speaker: 'Dark Knight', text: 'But the Demon King showed me true power!' },
        { speaker: 'Dark Knight', text: 'Now, face my blade!', emotion: 'angry' as const },
      ],
    },
    bossDefeat: {
      id: 'world2_boss_defeat',
      title: 'Light Returns',
      dialogues: [
        { speaker: 'Dark Knight', text: 'You... have freed me from the darkness...' },
        { speaker: 'Bomberman', text: 'The corruption is leaving you!' },
        { speaker: 'Dark Knight', text: 'Thank you, hero. I remember who I was now.' },
        { speaker: 'Dark Knight', text: 'The Demon King\'s power grows in the Volcanic Fortress.' },
        { speaker: 'Bomberman', text: 'Then that\'s where I\'m headed next!' },
      ],
    },
  },
  {
    worldId: 3,
    name: 'Volcanic Fortress',
    description: 'A fiery stronghold ruled by a fearsome dragon',
    intro: {
      id: 'world3_intro',
      title: 'The Burning Realm',
      dialogues: [
        { speaker: 'Narrator', text: 'The Volcanic Fortress burns with eternal flames.' },
        { speaker: 'Bomberman', text: 'The heat here is intense! I need to be careful.', emotion: 'surprised' as const },
        { speaker: 'Fire Sprite', text: 'Hero! The Fire Dragon has gone mad with power!' },
        { speaker: 'Fire Sprite', text: 'He threatens to erupt the entire volcano!' },
        { speaker: 'Bomberman', text: 'I won\'t let that happen!', emotion: 'determined' as const },
      ],
    },
    bossIntro: {
      id: 'world3_boss_intro',
      title: 'Fire Dragon\'s Wrath',
      dialogues: [
        { speaker: 'Fire Dragon', text: 'ROOOOAR! A tiny bomber dares challenge me?!' },
        { speaker: 'Bomberman', text: 'Your reign of fire ends today!' },
        { speaker: 'Fire Dragon', text: 'I am the mightiest of the Demon King\'s generals!' },
        { speaker: 'Fire Dragon', text: 'My flames will reduce you to ashes!' },
        { speaker: 'Bomberman', text: 'Bring it on, dragon!', emotion: 'determined' as const },
      ],
    },
    bossDefeat: {
      id: 'world3_boss_defeat',
      title: 'Flames Quelled',
      dialogues: [
        { speaker: 'Fire Dragon', text: 'My flames... extinguished...' },
        { speaker: 'Bomberman', text: 'The volcano is calming down!' },
        { speaker: 'Fire Sprite', text: 'You saved us all, hero!' },
        { speaker: 'Fire Sprite', text: 'But the Shadow Realm awaits... Be prepared.' },
        { speaker: 'Bomberman', text: 'Two more realms to go. I won\'t give up!' },
      ],
    },
  },
  {
    worldId: 4,
    name: 'Shadow Realm',
    description: 'A dimension of darkness and illusions',
    intro: {
      id: 'world4_intro',
      title: 'The Void Between',
      dialogues: [
        { speaker: 'Narrator', text: 'The Shadow Realm exists between light and darkness.' },
        { speaker: 'Bomberman', text: 'Everything here feels... wrong. Like a nightmare.' },
        { speaker: 'Shadow Guide', text: 'You\'ve come far, bomber. But this realm tests your mind.' },
        { speaker: 'Shadow Guide', text: 'The Shadow Lord feeds on fear and doubt.' },
        { speaker: 'Bomberman', text: 'I\'ve faced my fears before. I\'ll do it again!' },
      ],
    },
    bossIntro: {
      id: 'world4_boss_intro',
      title: 'Shadow Lord\'s Domain',
      dialogues: [
        { speaker: 'Shadow Lord', text: 'Welcome to my realm of eternal darkness...' },
        { speaker: 'Bomberman', text: 'Show yourself, Shadow Lord!' },
        { speaker: 'Shadow Lord', text: 'I am everywhere and nowhere. I am your deepest fears.' },
        { speaker: 'Shadow Lord', text: 'Can you defeat what you cannot see?' },
        { speaker: 'Bomberman', text: 'Light always conquers darkness!', emotion: 'determined' as const },
      ],
    },
    bossDefeat: {
      id: 'world4_boss_defeat',
      title: 'Shadows Dispelled',
      dialogues: [
        { speaker: 'Shadow Lord', text: 'The light... it burns...' },
        { speaker: 'Bomberman', text: 'Your illusions can\'t fool me anymore!' },
        { speaker: 'Shadow Guide', text: 'You\'ve done the impossible, hero.' },
        { speaker: 'Shadow Guide', text: 'Only the Demon King\'s castle remains.' },
        { speaker: 'Bomberman', text: 'It\'s time to end this. Once and for all!' },
      ],
    },
  },
  {
    worldId: 5,
    name: 'Demon Castle',
    description: 'The final stronghold of the Demon King',
    intro: {
      id: 'world5_intro',
      title: 'The Final Battle',
      dialogues: [
        { speaker: 'Narrator', text: 'The Demon Castle looms before our hero.' },
        { speaker: 'Bomberman', text: 'This is it. The source of all the corruption.' },
        { speaker: 'Elder', text: 'Bomberman! I\'ve come to give you my blessing.' },
        { speaker: 'Elder', text: 'The spirits of the four realms are with you.' },
        { speaker: 'Bomberman', text: 'Thank you, Elder. I\'ll save our kingdom!', emotion: 'determined' as const },
      ],
    },
    bossIntro: {
      id: 'world5_boss_intro',
      title: 'The Demon King',
      dialogues: [
        { speaker: 'Demon King', text: 'So, the little bomber has finally arrived.' },
        { speaker: 'Bomberman', text: 'Your reign of terror ends here!' },
        { speaker: 'Demon King', text: 'I have waited a thousand years for this moment.' },
        { speaker: 'Demon King', text: 'Your world will be consumed by darkness!' },
        { speaker: 'Demon King', text: 'PREPARE TO FACE TRUE POWER!', emotion: 'angry' as const },
        { speaker: 'Bomberman', text: 'For the kingdom! For everyone you\'ve hurt!', emotion: 'determined' as const },
      ],
    },
    bossDefeat: {
      id: 'world5_boss_defeat',
      title: 'Victory',
      dialogues: [
        { speaker: 'Demon King', text: 'IMPOSSIBLE! How can a mere bomber...!' },
        { speaker: 'Bomberman', text: 'The power of friendship and courage!' },
        { speaker: 'Demon King', text: 'This... isn\'t... over...' },
        { speaker: 'Narrator', text: 'With a final explosion, the Demon King was sealed away.' },
        { speaker: 'Narrator', text: 'Peace returned to the Bomber Kingdom at last.' },
      ],
    },
  },
];

class StoryManager {
  private currentCutscene: Cutscene | null = null;
  private currentDialogueIndex: number = 0;
  private isPlaying: boolean = false;
  private onComplete: (() => void) | null = null;

  public startCutscene(cutscene: Cutscene, onComplete?: () => void): void {
    this.currentCutscene = cutscene;
    this.currentDialogueIndex = 0;
    this.isPlaying = true;
    this.onComplete = onComplete || null;
  }

  public getCurrentDialogue(): DialogueLine | null {
    if (!this.currentCutscene || this.currentDialogueIndex >= this.currentCutscene.dialogues.length) {
      return null;
    }
    return this.currentCutscene.dialogues[this.currentDialogueIndex];
  }

  public nextDialogue(): boolean {
    if (!this.currentCutscene) return false;

    this.currentDialogueIndex++;
    
    if (this.currentDialogueIndex >= this.currentCutscene.dialogues.length) {
      this.endCutscene();
      return false;
    }
    
    return true;
  }

  public skipCutscene(): void {
    this.endCutscene();
  }

  private endCutscene(): void {
    this.isPlaying = false;
    this.currentCutscene = null;
    this.currentDialogueIndex = 0;
    
    if (this.onComplete) {
      this.onComplete();
      this.onComplete = null;
    }
  }

  public isPlayingCutscene(): boolean {
    return this.isPlaying;
  }

  public getCutsceneTitle(): string {
    return this.currentCutscene?.title || '';
  }

  public getProgress(): { current: number; total: number } {
    if (!this.currentCutscene) return { current: 0, total: 0 };
    return {
      current: this.currentDialogueIndex + 1,
      total: this.currentCutscene.dialogues.length,
    };
  }

  public getWorldStory(worldId: number): WorldStory | undefined {
    return WORLD_STORIES.find(w => w.worldId === worldId);
  }

  public getPrologue(): Cutscene {
    return GAME_STORY.prologue;
  }

  public getEpilogue(): Cutscene {
    return GAME_STORY.epilogue;
  }
}

export const storyManager = new StoryManager();
