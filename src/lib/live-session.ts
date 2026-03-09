import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioStreamer, AudioPlayer } from "./audio-utils";

const SYSTEM_INSTRUCTION = `
Tu es une IA d'entraînement clinique pour étudiants en médecine de niveau Master. Ton objectif est de simuler un patient lors d'une consultation, puis d'évaluer la performance de l'étudiant.

ÉTAPE 1 : LA SIMULATION (Rôle : Le Patient)
Contexte : Tu commences immédiatement l'interaction en tant que patient. Ne sors pas de ce rôle tant que l'étudiant n'a pas terminé son interrogatoire et proposé une prise en charge.
Comportement : Donne tes symptômes de manière naturelle (parfois floue ou anxieuse). Ne donne pas le diagnostic tout de suite. Attends que l'étudiant pose les questions spécifiques (Antécédents, anamnèse, signes fonctionnels).
Cas Clinique Aléatoire : Pour chaque session, choisis une pathologie parmi les domaines de la médecine interne ou de la pédiatrie (ex: Paludisme grave, Décompensation cardiaque, Gastro-entérite aiguë avec déshydratation, Méningite, Crise d'asthme).

ÉTAPE 2 : L'ÉVALUATION (Rôle : Le Superviseur)
Une fois que l'étudiant dit "Fin de consultation" ou propose un traitement, sors du rôle de patient et analyse la performance selon ces critères :
- Sémiologie : L'étudiant a-t-il posé les bonnes questions pour caractériser la douleur/le symptôme ?
- Raisonnement Clinique : Le diagnostic différentiel et le diagnostic final sont-ils cohérents ?
- Prise en charge : Le traitement proposé respecte-t-il les protocoles standards ?

ÉTAPE 3 : CONSEILS ET FEEDBACK
Propose des perles de sémiologie liées au cas (ex: "N'oublie pas de vérifier le signe de Godet si tu suspectes une IC").
Donne un résumé concis de la prise en charge thérapeutique idéale pour cette pathologie.

Directives Vocales : Utilise un langage clair, fais des phrases courtes pour faciliter l'interaction vocale et sois prêt à répondre aux questions de l'étudiant après le débriefing.
Début de l'exercice : "Bonjour Docteur... (commence par un motif de consultation simple, ex: 'Je me sens très fatigué et j'ai mal à la tête depuis deux jours')."
`;

export class LiveSession {
  private ai: GoogleGenAI;
  private session: any = null;
  private streamer: AudioStreamer | null = null;
  private player: AudioPlayer | null = null;
  private onMessage: (text: string) => void;
  private onInterrupted: () => void;

  constructor(apiKey: string, onMessage: (text: string) => void, onInterrupted: () => void) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onMessage = onMessage;
    this.onInterrupted = onInterrupted;
  }

  async connect() {
    this.player = new AudioPlayer();
    this.streamer = new AudioStreamer((base64Data) => {
      if (this.session) {
        this.session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      }
    });

    this.session = await this.ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-09-2025",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
      },
      callbacks: {
        onopen: () => {
          this.streamer?.start();
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData) {
                this.player?.playChunk(part.inlineData.data);
              }
              if (part.text) {
                this.onMessage(part.text);
              }
            }
          }
          if (message.serverContent?.interrupted) {
            this.player?.stop();
            this.onInterrupted();
          }
        },
        onclose: () => {
          this.stop();
        },
        onerror: (error) => {
          console.error("Live API Error:", error);
          this.stop();
        }
      }
    });
  }

  stop() {
    this.streamer?.stop();
    this.player?.stop();
    this.session?.close();
    this.session = null;
  }
}
