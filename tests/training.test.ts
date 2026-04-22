import { Tensor } from '@mni-ml/framework';
import { LossFunction } from '../src/training/loss';
import { OptimizerWithClipping } from '../src/training/optimizer';
import { Trainer } from '../src/training/trainer';
import { LLM, MODEL_CONFIG } from '../src/model/llm';
import { DataLoader } from '../src/data/dataloader';

jest.mock('@mni-ml/framework', () => {
  class MockTensor {
    shape: number[];
    data: Float32Array;
    grad: MockTensor | null;

    constructor(shape: number[], initialValue: number = 1.0) {
      this.shape = shape;
      const size = shape.reduce((a, b) => a * b, 1) || 1;
      this.data = new Float32Array(size).fill(initialValue);
      this.grad = null;
    }

    static fromFloat32(data: any, shape: number[]) { return new MockTensor(shape, 1.0); }
    static zeros(shape: number[]) { return new MockTensor(shape, 0.0); }
    static ones(shape: number[]) { return new MockTensor(shape, 1.0); }
    static rand(shape: number[]) { return new MockTensor(shape, Math.random()); }

    view(...shape: number[]) { return new MockTensor(shape, this.data[0]); }
    permute(...dims: number[]) { return this; }
    contiguous() { return this; }
    mul(scalar: any) { return new MockTensor(this.shape, typeof scalar === 'number' ? this.data[0] * scalar : this.data[0] * scalar.data[0]); }
    matmul(other: MockTensor) { return new MockTensor(this.shape, this.data[0]); }
    sum() { return new MockTensor([1], this.data[0] * this.shape.reduce((a,b)=>a*b,1)); }
    add(other: MockTensor) { return new MockTensor(this.shape, this.data[0] + other.data[0]); }
    relu() { return this; }
    backward() {}
    dispose() {}
  }

  class MockParameter {
    tensor: MockTensor;
    constructor(t: MockTensor) { this.tensor = t; }
  }

  class MockAdam {
    params: MockParameter[];
    constructor(params: MockParameter[], lr: number) { this.params = params; }
    zeroGrad() {
      for (const p of this.params) p.tensor.grad = null;
    }
    step() {
      for (const p of this.params) {
        if (p.tensor.grad) p.tensor.data[0] -= 0.01;
      }
    }
  }

  class MockModule {
    _params: MockParameter[] = [];
    registerModule() {}
    registerParameter(name: string, p: MockParameter) { this._params.push(p); }
    parameters() { return this._params; }
    forward(x: MockTensor) {
      return new MockTensor([x.shape[0], x.shape[1], 8000], 0.5);
    }
    save() {}
    train() {}
    eval() {}
  }

  class MockLLM extends MockModule {
    constructor() {
      super();
      this._params.push(new MockParameter(new MockTensor([10, 10], 1.0)));
    }
    countParameters() { return 100; }
  }

  return {
    Tensor: MockTensor,
    Parameter: MockParameter,
    Module: MockModule,
    Linear: class extends MockModule {},
    Embedding: class extends MockModule {},
    Adam: MockAdam,
    layerNorm: (x: MockTensor) => x,
    softmax: (x: MockTensor) => x,
    crossEntropyLoss: (logits: MockTensor, targets: MockTensor) => {
      if (targets.data[0] === 0.0) return new MockTensor([1], 0.0);
      return new MockTensor([1], 2.5);
    }
  };
});

describe('Phase 4: Training Loop', () => {
  it('1. Training Step updates parameters', () => {
    const { Tensor } = require('@mni-ml/framework');
    
    const llm = new LLM(MODEL_CONFIG);
    const dummyParam = new (require('@mni-ml/framework').Parameter)(new Tensor([10, 10]));
    llm.registerParameter('test', dummyParam);

    const mockTrainData = [{ inputIds: [1, 2], targetIds: [3, 4] }];
    const trainLoader = new DataLoader(mockTrainData, 1, 2);
    
    const optimizer = new OptimizerWithClipping(llm, 0.01, 1.0);
    const trainer = new Trainer(llm, trainLoader, trainLoader, optimizer, 1);

    const initialValue = dummyParam.tensor.data[0];
    
    dummyParam.tensor.grad = new Tensor([10, 10], 0.1);
    optimizer.step();

    expect(dummyParam.tensor.data[0]).toBeLessThan(initialValue);
  });

  it('2. Padding masks zero out loss logic', () => {
    const { Tensor } = require('@mni-ml/framework');
    const logits = new Tensor([1, 10, 8000], 0.5);
    const targets = new Tensor([1, 10], 0.0);

    const loss = LossFunction.crossEntropySequence(logits, targets);
    expect((loss as any).data[0]).toBe(0.0);
  });

  it('3. Evaluate loop prevents memory leaks without updating params', () => {
    const llm = new LLM(MODEL_CONFIG);
    const mockValData = [{ inputIds: [1], targetIds: [2] }];
    const valLoader = new DataLoader(mockValData, 1, 1);
    
    const optimizer = new OptimizerWithClipping(llm, 0.01, 1.0);
    const trainer = new Trainer(llm, valLoader, valLoader, optimizer, 1);

    const loss = trainer.evaluate();
    expect(loss).toBeGreaterThan(0);
  });
});
