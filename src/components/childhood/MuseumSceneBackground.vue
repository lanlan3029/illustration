<template>
  <div class="museum-scene" :class="{ 'museum-scene--paused': !playing }" aria-hidden="true">
    <svg
      class="museum-scene__svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1280 720"
      preserveAspectRatio="xMidYMid slice"
    >
      <style>
        .museum-scene__wing {
          fill: #f6e89a;
          stroke: #2a2a2a;
          stroke-width: 1.35;
          stroke-linejoin: round;
          stroke-linecap: round;
        }
        .museum-scene__body {
          fill: #3f382e;
          stroke: #2a2a2a;
          stroke-width: 1.1;
        }
        .museum-scene__line {
          fill: none;
          stroke: #2a2a2a;
          stroke-width: 1.15;
          stroke-linecap: round;
        }
      </style>
      <defs>
        <g id="museum-butterfly-drawing">
          <g id="museum-wing-left">
            <path
              class="museum-scene__wing"
              d="M-1.2 -1.5 C-9 -13,-22 -11,-24 -1.5 C-22 6,-11 5.5,-1 2.2 Z"
            />
            <path
              class="museum-scene__wing"
              d="M-1 2 C-8 5,-14 11,-9 15.5 C-3.5 16.5,-1.5 8.5,-0.6 4 Z"
            />
            <animateTransform
              v-if="playing"
              attributeName="transform"
              type="rotate"
              values="0;-26;0;18;0"
              dur="0.38s"
              repeatCount="indefinite"
              additive="sum"
            />
          </g>
          <g id="museum-wing-right">
            <path
              class="museum-scene__wing"
              d="M1.2 -1.5 C9 -13,22 -11,24 -1.5 C22 6,11 5.5,1 2.2 Z"
            />
            <path
              class="museum-scene__wing"
              d="M1 2 C8 5,14 11,9 15.5 C3.5 16.5,1.5 8.5,0.6 4 Z"
            />
            <animateTransform
              v-if="playing"
              attributeName="transform"
              type="rotate"
              values="0;26;0;-18;0"
              dur="0.38s"
              repeatCount="indefinite"
              additive="sum"
            />
          </g>
          <ellipse class="museum-scene__body" cx="0" cy="1.2" rx="2.05" ry="7.1" />
          <circle class="museum-scene__body" cx="0" cy="-5.6" r="2.15" />
          <path class="museum-scene__line" d="M-0.6 -7.2 C-4 -14,-7.5 -15.5,-9 -14.2" />
          <path class="museum-scene__line" d="M0.6 -7.2 C4 -14,7.5 -15.5,9 -14.2" />
        </g>
      </defs>

      <image
        class="museum-scene__bg"
        :href="bgSrc"
        width="1280"
        height="720"
        preserveAspectRatio="xMidYMid slice"
      />

      <path
        id="museum-flight-a"
        fill="none"
        stroke="none"
        d="M 1092 248 C 1010 168 860 118 670 148 C 520 172 330 148 248 204 C 188 248 236 318 360 292 C 520 258 690 198 860 218 C 980 232 1068 198 1092 248"
      />
      <path
        id="museum-flight-b"
        fill="none"
        stroke="none"
        d="M 980 320 C 820 280 620 340 480 300 C 360 268 280 360 380 380 C 520 400 720 340 880 360 C 960 372 1020 350 980 320"
      />
      <path
        id="museum-flight-c"
        fill="none"
        stroke="none"
        d="M 180 180 C 280 120 420 100 560 130 C 680 155 780 120 860 160 C 920 188 880 240 760 260 C 620 285 380 260 180 180"
      />

      <template v-if="playing">
        <g class="museum-scene__bf museum-scene__bf--a">
          <use href="#museum-butterfly-drawing" transform="scale(1.15)" />
          <animateMotion dur="16s" repeatCount="indefinite" rotate="auto">
            <mpath href="#museum-flight-a" />
          </animateMotion>
        </g>

        <g class="museum-scene__bf museum-scene__bf--b">
          <use href="#museum-butterfly-drawing" transform="scale(0.95)" />
          <animateMotion dur="22s" begin="-6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#museum-flight-b" />
          </animateMotion>
        </g>

        <g class="museum-scene__bf museum-scene__bf--c">
          <use href="#museum-butterfly-drawing" transform="scale(0.82)" />
          <animateMotion dur="19s" begin="-11s" repeatCount="indefinite" rotate="auto">
            <mpath href="#museum-flight-c" />
          </animateMotion>
        </g>
      </template>
    </svg>
  </div>
</template>

<script>
import bgSrc from '@/assets/images/newyear/homepage-bg-museum-v2.png'

export default {
  name: 'MuseumSceneBackground',
  props: {
    playing: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return { bgSrc }
  },
}
</script>

<style scoped>
.museum-scene {
  position: absolute;
  inset: 0 0 auto 0;
  height: clamp(300px, 56vh, 560px);
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.museum-scene::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 72px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff);
}

.museum-scene__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.museum-scene__bg {
  pointer-events: none;
}

</style>
