/**
 * style的数据
 * height: 28
 * left: 0
 * opacity: 1
 * rotate: 0
 * top: 0
 * width: 28
 * 
 * filter的数据
 * ['top', 'left', 'width', 'height', 'rotate']
 */

export const styleData = [
    { key: 'width', label: '宽' },
    { key: 'height', label: '高' },
    { key: 'color', label: '颜色' },
    { key: 'backgroundColor', label: '背景色' },
    { key: 'borderWidth', label: '边框宽度' },
    { key: 'borderStyle', label: '边框风格' },
    { key: 'borderColor', label: '边框颜色' },
    { key: 'borderRadius', label: '边框半径' },
    { key: 'fontSize', label: '字体大小' },
    { key: 'fontWeight', label: '字体粗细' },
    { key: 'lineHeight', label: '行高' },
    { key: 'letterSpacing', label: '字间距' },
    { key: 'textAlign', label: '左右对齐' },
    { key: 'verticalAlign', label: '上下对齐' },
    { key: 'opacity', label: '透明度' },
    { key: 'rotate', label: '角度' },
    { key: 'zIndex', label: '图层' }
]

export function getStyle(style, filter = []) {
    const needUnit = [
        'fontSize',
        'width',
        'height',
        'top',
        'left',
        'borderWidth',
        'letterSpacing',
        'borderRadius',
    ]

    const result = {}
        // 提取style中的所有key值
    Object.keys(style).forEach(key => {
        // 查看filter中是否含有key，比如opacity
        if (!filter.includes(key)) {
            // 如果key不等于rotate
            if (key != 'rotate') {
                // 则在result中添加key
                result[key] = style[key]
                    // 如果needUnit中含有key
                if (needUnit.includes(key)) {
                    result[key] += 'px'
                }
            } else {
                // 如果key等于rotate
                result.transform = key + '(' + style[key] + 'deg)'
            }
        }
    })
    return result
}