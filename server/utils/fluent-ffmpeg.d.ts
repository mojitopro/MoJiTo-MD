// Type declarations for fluent-ffmpeg to support Termux compatibility
declare module 'fluent-ffmpeg' {
  interface FfmpegCommand {
    outputOptions(options: string[]): FfmpegCommand;
    save(output: string): FfmpegCommand;
    on(event: 'end', callback: () => void): FfmpegCommand;
    on(event: 'error', callback: (err: any) => void): FfmpegCommand;
  }

  function ffmpeg(input: string): FfmpegCommand;

  export = ffmpeg;
}