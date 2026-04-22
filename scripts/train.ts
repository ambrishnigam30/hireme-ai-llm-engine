/**
 * train.ts
 */
import { LLM, MODEL_CONFIG } from '../src/model/llm';
import { DataLoader } from '../src/data/dataloader';
import { OptimizerWithClipping } from '../src/training/optimizer';
import { Trainer } from '../src/training/trainer';

async function main() {
  console.log("Initializing LLM...");
  const model = new LLM(MODEL_CONFIG);
  
  console.log(`Model initialized with ${model.countParameters()} parameters.`);

  console.log("Setting up local mock DataLoaders for pipeline validation...");
  
  const mockTrainData = Array.from({ length: 20 }, (_, i) => ({
    inputIds: new Array(128).fill(i % 8000),
    targetIds: new Array(128).fill((i + 1) % 8000)
  }));
  
  const mockValData = Array.from({ length: 8 }, (_, i) => ({
    inputIds: new Array(128).fill((i + 20) % 8000),
    targetIds: new Array(128).fill((i + 21) % 8000)
  }));

  const trainLoader = new DataLoader(mockTrainData, 4, 0);
  const valLoader = new DataLoader(mockValData, 4, 0);

  const optimizer = new OptimizerWithClipping(model, 3e-4, 1.0);
  
  const epochs = 2;
  const trainer = new Trainer(model, trainLoader, valLoader, optimizer, epochs);

  console.log("Starting training loop...");
  trainer.train();
  console.log("Training complete.");
}

if (require.main === module) {
  main().catch(console.error);
}
