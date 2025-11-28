import { JSONPath } from 'jsonpath-plus';

export const interpolateJSONPath = (
  str: string,
  manifest: any,
  interpolator: string[] = ['{{', '}}'],
): string => {
  return str
    .split(interpolator[0])
    .map((s1, i) => {
      if (i === 0) {
        return s1;
      }

      const s2 = s1.split(interpolator[1]);
      if (s1 === s2[0]) {
        return interpolator[0] + s2[0];
      }

      if (s2.length > 1) {
        s2[0] = JSONPath({ json: manifest, path: s2[0].trim(), wrap: false });
      }

      return s2.join('');
    })
    .join('');
};
