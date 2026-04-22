declare module '@mni-ml/framework' {
  export class Tensor {
    shape: number[];
    static fromFloat32(data: Float32Array, shape: number[]): Tensor;
    static zeros(shape: number[]): Tensor;
    static ones(shape: number[]): Tensor;
    static rand(shape: number[]): Tensor;
    add(other: Tensor): Tensor;
    mul(scalarOrTensor: number | Tensor): Tensor;
    matmul(other: Tensor): Tensor;
    view(...shape: number[]): Tensor;
    permute(...dims: number[]): Tensor;
    contiguous(): Tensor;
    relu(): Tensor;
    toFloat32Array?(): Float32Array;
  }

  export class Parameter {
    tensor: Tensor;
    constructor(tensor: Tensor);
  }

  export class Module {
    constructor();
    registerModule(name: string, module: Module): void;
    registerParameter(name: string, param: Parameter): void;
    parameters(): Parameter[];
    forward(...args: any[]): Tensor;
  }

  export class Linear extends Module {
    constructor(inFeatures: number, outFeatures: number);
    forward(x: Tensor): Tensor;
  }

  export class Embedding extends Module {
    constructor(numEmbeddings: number, embeddingDim: number);
    forward(x: Tensor): Tensor;
  }

  export function softmax(x: Tensor, dim: number): Tensor;
  export function layerNorm(x: Tensor, gamma: Tensor, beta: Tensor, eps: number): Tensor;
}
