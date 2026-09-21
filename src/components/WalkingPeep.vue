<template>
  <div
    class="walking-peep"
    :class="{
      'walking-peep--paused': !playing,
      'walking-peep--one-way': !pingPong,
    }"
    :style="cssVars"
  >
    <div class="walking-peep__stage">
      <div class="walking-peep__travel">
        <div class="walking-peep__figure">
          <img
            class="walking-peep__sprite"
            :src="peepSrc"
            alt=""
            draggable="false"
          />
        </div>
      </div>
      <div class="walking-peep__shadow-wrap" aria-hidden="true">
        <div class="walking-peep__shadow" />
      </div>
    </div>
  </div>
</template>

<script>
import peepSrc from '@/assets/peeps/peep-standing-9.svg'

export default {
  name: 'WalkingPeep',
  props: {
    /** 人物显示高度（px） */
    height: {
      type: Number,
      default: 200,
    },
    /** 水平移动距离，数字为 px，字符串可传 calc / % */
    walkDistance: {
      type: [Number, String],
      default: 280,
    },
    /** 速度倍率，越大走得越快 */
    speed: {
      type: Number,
      default: 1,
    },
    /** 是否来回走 */
    pingPong: {
      type: Boolean,
      default: true,
    },
    /** 折返时是否镜像人物 */
    flipOnReturn: {
      type: Boolean,
      default: true,
    },
    /** 是否播放动画 */
    playing: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      peepSrc,
    }
  },
  computed: {
    cssVars() {
      const distance =
        typeof this.walkDistance === 'number'
          ? `${this.walkDistance}px`
          : this.walkDistance
      const speed = Math.max(0.25, this.speed)
      const stepDuration = `${0.55 / speed}s`
      const walkDuration = `${6 / speed}s`

      return {
        '--peep-height': `${this.height}px`,
        '--walk-distance': distance,
        '--step-duration': stepDuration,
        '--walk-duration': walkDuration,
        '--flip-scale': this.flipOnReturn ? '-1' : '1',
      }
    },
  },
}
</script>

<style scoped>
.walking-peep {
  position: relative;
  width: 100%;
  min-height: calc(var(--peep-height) + 24px);
  overflow: hidden;
}

.walking-peep__stage {
  position: relative;
  width: 100%;
  height: calc(var(--peep-height) + 16px);
}

.walking-peep__travel {
  position: absolute;
  left: 0;
  bottom: 14px;
  animation: peep-travel var(--walk-duration) ease-in-out infinite alternate;
  will-change: transform;
}

.walking-peep--one-way .walking-peep__travel,
.walking-peep--one-way .walking-peep__shadow-wrap {
  animation-direction: normal;
  animation-timing-function: linear;
}

.walking-peep__figure {
  transform-origin: 50% 92%;
  animation: peep-bob var(--step-duration) ease-in-out infinite;
  will-change: transform;
}

.walking-peep__sprite {
  display: block;
  height: var(--peep-height);
  width: auto;
  user-select: none;
  pointer-events: none;
}

.walking-peep__shadow-wrap {
  position: absolute;
  left: 0;
  bottom: 0;
  animation: peep-shadow-travel var(--walk-duration) ease-in-out infinite alternate;
  will-change: transform;
}

.walking-peep__shadow {
  width: calc(var(--peep-height) * 0.34);
  height: calc(var(--peep-height) * 0.05);
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.14);
  animation: peep-shadow-bob var(--step-duration) ease-in-out infinite;
  will-change: transform, opacity;
}

.walking-peep--paused .walking-peep__travel,
.walking-peep--paused .walking-peep__figure,
.walking-peep--paused .walking-peep__shadow-wrap,
.walking-peep--paused .walking-peep__shadow {
  animation-play-state: paused;
}

@keyframes peep-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg) scaleX(1);
  }
  25% {
    transform: translateY(-8px) rotate(1.5deg) scaleX(1.015);
  }
  50% {
    transform: translateY(0) rotate(2deg) scaleX(1);
  }
  75% {
    transform: translateY(-8px) rotate(-1.5deg) scaleX(0.985);
  }
}

@keyframes peep-travel {
  from {
    transform: translateX(0) scaleX(1);
  }
  to {
    transform: translateX(var(--walk-distance)) scaleX(var(--flip-scale, -1));
  }
}

@keyframes peep-shadow-travel {
  from {
    transform: translateX(calc(var(--peep-height) * 0.1));
  }
  to {
    transform: translateX(calc(var(--walk-distance) + var(--peep-height) * 0.1));
  }
}

@keyframes peep-shadow-bob {
  0%,
  100% {
    opacity: 0.18;
    transform: scale(1);
  }
  25%,
  75% {
    opacity: 0.1;
    transform: scale(0.82);
  }
  50% {
    opacity: 0.16;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .walking-peep__travel,
  .walking-peep__figure,
  .walking-peep__shadow-wrap,
  .walking-peep__shadow {
    animation: none;
  }
}
</style>
