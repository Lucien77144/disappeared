import type { Audio, AudioListener, Object3D, PositionalAudio } from 'three'

/**
 * Audio object
 */
export type TAudio = Omit<
	PositionalAudio | Audio,
	'play' | 'pause' | 'stop' | 'setVolume' | 'setLoop' | 'source'
> & {
	play: (delay?: number) => void
	pause: () => void
	stop: () => void
	setVolume: (volume: number) => void
	setLoop: (loop: boolean) => void
	setRefDistance: (distance: number) => void
	isPlaying: boolean
	isSingle?: boolean
	volume?: number
	source?:
		| (Audio['source'] & {
				mediaElement?: HTMLMediaElement
		  })
		| null
}

/**
 * Audio object
 * @param {string} name - Name of the audio
 * @param {AudioListener} listener - Listener of the audio
 * @param {boolean} isSingle - If audio is single
 * @param {Object3D} parent - Parent of the audio
 * @param {number} distance - Distance of the audio
 * @param {boolean} play - If audio is playing
 * @param {boolean} loop - If audio is looping
 * @param {boolean} persist - If true, the audio will not be removed on scene change
 * @param {number} volume - Volume of the audio
 */
export type TAudioParams = {
	name: string
	listener: AudioListener
	isSingle: boolean
	parent: Object3D
	distance: number
	play: boolean
	loop: boolean
	persist: boolean
	volume: number
}
