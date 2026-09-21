<template>
  <div class="gallery-art-frame" :class="`gallery-art-frame--${variant}`">
    <div class="gallery-art-frame__photo">
      <slot />
    </div>

    <!-- 椭圆金框 -->
    <svg
      v-if="variant === 'oval-gold'"
      class="gallery-art-frame__svg"
      viewBox="0 0 240 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#F4C842"
        fill-rule="evenodd"
        stroke="#D9A824"
        stroke-width="2.2"
        stroke-linejoin="round"
        d="M120 14 C188 14 232 72 232 150 C232 228 188 286 120 286 C52 286 8 228 8 150 C8 72 52 14 120 14 Z
           M120 46 C78 46 48 88 48 150 C48 212 78 254 120 254 C162 254 192 212 192 150 C192 88 162 46 120 46 Z"
      />
      <path
        fill="none"
        stroke="#E8B830"
        stroke-width="1.4"
        d="M120 46 C78 46 48 88 48 150 C48 212 78 254 120 254 C162 254 192 212 192 150 C192 88 162 46 120 46 Z"
      />
      <g fill="#F4C842" stroke="#D9A824" stroke-width="1.6">
        <path d="M120 2 C132 2 140 10 140 20 C140 28 132 32 120 30 C108 32 100 28 100 20 C100 10 108 2 120 2 Z" />
        <path d="M230 138 C238 138 244 146 242 156 C240 164 232 168 226 162 C220 168 212 164 210 156 C208 146 214 138 222 138 Z" />
        <path d="M120 298 C132 298 140 290 140 280 C140 272 132 268 120 270 C108 268 100 272 100 280 C100 290 108 298 120 298 Z" />
        <path d="M10 138 C2 138 -4 146 -2 156 C0 164 8 168 14 162 C20 168 28 164 30 156 C32 146 26 138 18 138 Z" />
      </g>
      <g fill="none" stroke="#C89418" stroke-width="1.2" stroke-linecap="round">
        <path d="M115 12 C118 16 122 16 125 12" />
        <path d="M225 148 C229 151 233 151 237 148" />
        <path d="M115 288 C118 284 122 284 125 288" />
        <path d="M15 148 C19 151 23 151 27 148" />
      </g>
    </svg>

    <!-- 手绘矩形 + 蓝色角花 -->
    <svg
      v-else-if="variant === 'scroll-blue'"
      class="gallery-art-frame__svg"
      viewBox="0 0 200 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#FFF3A0"
        fill-rule="evenodd"
        stroke="#E8D070"
        stroke-width="2"
        stroke-linejoin="round"
        d="M16 18 C10 8 26 4 38 8 L162 6 C178 4 190 16 188 32
           L194 228 C198 244 184 254 168 252 L34 254 C18 256 6 242 8 226 Z
           M34 42 C30 36 40 32 50 34 L150 32 C160 30 168 38 166 50
           L172 214 C174 226 164 232 152 230 L46 232 C34 234 26 222 28 210 Z"
      />
      <g fill="none" stroke="#5BA8FF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M42 38 C28 24 18 34 24 50 C30 64 46 54 42 38 Z" />
        <path d="M158 38 C172 24 182 34 176 50 C170 64 154 54 158 38 Z" />
        <path d="M42 222 C28 236 18 226 24 210 C30 196 46 206 42 222 Z" />
        <path d="M158 222 C172 236 182 226 176 210 C170 196 154 206 158 222 Z" />
      </g>
      <g fill="none" stroke="#5BA8FF" stroke-width="3" stroke-linecap="round">
        <path d="M52 48 C44 40 36 44 40 54" />
        <path d="M148 48 C156 40 164 44 160 54" />
        <path d="M52 212 C44 220 36 216 40 206" />
        <path d="M148 212 C156 220 164 216 160 206" />
      </g>
    </svg>

    <!-- 手绘矩形 + 紫色角花 -->
    <svg
      v-else
      class="gallery-art-frame__svg"
      viewBox="0 0 200 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#FFCC33"
        fill-rule="evenodd"
        stroke="#E0AD20"
        stroke-width="2"
        stroke-linejoin="round"
        d="M14 20 C8 10 24 6 36 10 L164 8 C180 6 192 18 190 34
           L196 230 C200 246 186 256 170 254 L30 256 C14 258 4 244 6 228 Z
           M32 44 C28 38 38 34 48 36 L152 34 C162 32 170 40 168 52
           L174 216 C176 228 166 234 154 232 L48 234 C36 236 28 224 30 212 Z"
      />
      <g fill="none" stroke="#8B3DFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M40 36 C26 22 14 32 20 48 C26 62 42 52 40 36 Z" />
        <path d="M160 36 C174 22 186 32 180 48 C174 62 158 52 160 36 Z" />
        <path d="M40 224 C26 238 14 228 20 212 C26 198 42 208 40 224 Z" />
        <path d="M160 224 C174 238 186 228 180 212 C174 198 158 208 160 224 Z" />
      </g>
      <g fill="none" stroke="#8B3DFF" stroke-width="2.8" stroke-linecap="round">
        <path d="M48 52 C38 44 30 48 34 58 C38 68 50 62 48 52 Z" />
        <path d="M152 52 C162 44 170 48 166 58 C162 68 150 62 152 52 Z" />
      </g>
    </svg>

    <div v-if="caption || date" class="gallery-art-frame__plaque">
      <span v-if="caption" class="gallery-art-frame__title">{{ caption }}</span>
      <span v-if="date" class="gallery-art-frame__date">{{ date }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GalleryArtFrame',
  props: {
    variant: {
      type: String,
      default: 'scroll-blue',
      validator: (v) => ['oval-gold', 'scroll-blue', 'scroll-purple'].includes(v),
    },
    caption: {
      type: String,
      default: '',
    },
    date: {
      type: String,
      default: '',
    },
  },
}
</script>

<style scoped>
.gallery-art-frame {
  position: relative;
  width: 100%;
  filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.45));
  transition: filter 0.35s ease, transform 0.35s ease;
}

.gallery-art-frame__photo {
  position: absolute;
  overflow: hidden;
  background: #fff;
  z-index: 0;
}

.gallery-art-frame__photo :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-art-frame__svg {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
}

.gallery-art-frame__plaque {
  position: relative;
  z-index: 2;
  margin-top: -4px;
  padding: 8px 4px 0;
  text-align: center;
}

.gallery-art-frame__title {
  display: block;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-art-frame__date {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.08em;
}

/* 椭圆金框：照片开窗 */
.gallery-art-frame--oval-gold .gallery-art-frame__photo {
  top: 15.5%;
  left: 20%;
  right: 20%;
  bottom: 18%;
  border-radius: 50% / 46%;
}

/* 蓝色角花框 */
.gallery-art-frame--scroll-blue .gallery-art-frame__photo {
  top: 16%;
  left: 17%;
  right: 17%;
  bottom: 17%;
  border-radius: 2px;
}

/* 紫色角花框 */
.gallery-art-frame--scroll-purple .gallery-art-frame__photo {
  top: 16.5%;
  left: 17.5%;
  right: 17.5%;
  bottom: 16.5%;
  border-radius: 2px;
}

.gallery-art-frame--oval-gold {
  aspect-ratio: 240 / 300;
}

.gallery-art-frame--scroll-blue,
.gallery-art-frame--scroll-purple {
  aspect-ratio: 200 / 260;
}
</style>
