import 'dart:async';
import 'dart:developer' as developer;

import 'ai_exceptions.dart';
import 'ai_models.dart';
import 'gemini_service.dart';
import 'groq_service.dart';
import 'openrouter_service.dart';
import 'prompt_builder.dart';

/// Central AI orchestration service for the ILAW Lesson Plan Generator.
///
/// The UI must call this service only. Provider-specific services remain
/// isolated behind [AIProviderClient] so failover, retry, logging, and response
/// validation are handled consistently in one place.
class AIService {
  AIService({
    GeminiService? geminiService,
    OpenRouterService? openRouterService,
    GroqService? groqService,
    PromptBuilder? promptBuilder,
    Duration requestTimeout = const Duration(seconds: 90),
    int maxRetriesPerModel = 1,
  })  : _promptBuilder = promptBuilder ?? const PromptBuilder(),
        _requestTimeout = requestTimeout,
        _maxRetriesPerModel = maxRetriesPerModel,
        _clients = [
          geminiService ?? GeminiService(),
          openRouterService ?? OpenRouterService(),
          groqService ?? GroqService(),
        ];

  final PromptBuilder _promptBuilder;
  final Duration _requestTimeout;
  final int _maxRetriesPerModel;
  final List<AIProviderClient> _clients;

  /// Generates a complete ILAW lesson plan using automatic provider/model
  /// failover.
  ///
  /// Failover order:
  /// 1. Gemini: Gemini 2.5 Pro
  /// 2. OpenRouter: GPT-5.5
  /// 3. OpenRouter: Gemini 2.5 Pro
  /// 4. OpenRouter: Qwen 3 235B
  /// 5. Groq: Qwen 3.6 27B
  /// 6. Groq: Llama 3.3 70B Versatile
  Future<String> generateILAWLessonPlan({
    required ILawLessonInput input,
  }) async {
    final prompt = _promptBuilder.buildILAWLessonPlanPrompt(input);
    return generateFromPrompt(prompt);
  }

  /// Sends an already-built prompt through the AI failover pipeline.
  Future<String> generateFromPrompt(String prompt) async {
    if (prompt.trim().isEmpty) {
      throw const AIValidationException('Prompt cannot be empty.');
    }

    final attempts = _buildAttemptPlan();
    final failures = <AIAttemptFailure>[];

    for (final attempt in attempts) {
      final client = _clientFor(attempt.provider);
      final result = await _tryModelWithRetries(
        client: client,
        attempt: attempt,
        prompt: prompt,
      );

      if (result.response != null) {
        return result.response!;
      }

      failures.addAll(result.failures);
      _logFailover(attempt, failures.last);
    }

    throw AIFailoverException(
      'All AI providers failed. Please check API keys, model availability, '
      'network connection, rate limits, or provider status.',
      failures: failures,
    );
  }

  List<AIModelAttempt> _buildAttemptPlan() {
    return const [
      AIModelAttempt(
        provider: AIProvider.gemini,
        model: AIModels.gemini25Pro,
      ),
      AIModelAttempt(
        provider: AIProvider.openRouter,
        model: AIModels.openRouterGpt55,
      ),
      AIModelAttempt(
        provider: AIProvider.openRouter,
        model: AIModels.openRouterGemini25Pro,
      ),
      AIModelAttempt(
        provider: AIProvider.openRouter,
        model: AIModels.openRouterQwen3235B,
      ),
      AIModelAttempt(
        provider: AIProvider.groq,
        model: AIModels.groqQwen3627B,
      ),
      AIModelAttempt(
        provider: AIProvider.groq,
        model: AIModels.groqLlama3370BVersatile,
      ),
    ];
  }

  Future<_AttemptResult> _tryModelWithRetries({
    required AIProviderClient client,
    required AIModelAttempt attempt,
    required String prompt,
  }) async {
    final failures = <AIAttemptFailure>[];

    for (var retry = 0; retry <= _maxRetriesPerModel; retry += 1) {
      final stopwatch = Stopwatch()..start();
      _logAttemptStart(attempt, retry);

      try {
        final response = await client
            .generateText(
              prompt: prompt,
              model: attempt.model,
            )
            .timeout(_requestTimeout);

        stopwatch.stop();
        final validated = _validateResponse(response, attempt);
        _logAttemptSuccess(attempt, retry, stopwatch.elapsed);
        return _AttemptResult(response: validated, failures: failures);
      } on TimeoutException catch (error, stackTrace) {
        stopwatch.stop();
        failures.add(
          _failure(
            attempt: attempt,
            retry: retry,
            duration: stopwatch.elapsed,
            error: AITimeoutException('Request timed out.', cause: error),
            stackTrace: stackTrace,
          ),
        );
      } on AIException catch (error, stackTrace) {
        stopwatch.stop();
        failures.add(
          _failure(
            attempt: attempt,
            retry: retry,
            duration: stopwatch.elapsed,
            error: error,
            stackTrace: stackTrace,
          ),
        );
      } catch (error, stackTrace) {
        stopwatch.stop();
        failures.add(
          _failure(
            attempt: attempt,
            retry: retry,
            duration: stopwatch.elapsed,
            error: AIProviderException(
              'Unexpected AI provider error.',
              cause: error,
            ),
            stackTrace: stackTrace,
          ),
        );
      }
    }

    return _AttemptResult(failures: failures);
  }

  AIProviderClient _clientFor(AIProvider provider) {
    return _clients.firstWhere(
      (client) => client.provider == provider,
      orElse: () => throw AIUnsupportedModelException(
        'No AI client registered for provider: ${provider.name}.',
      ),
    );
  }

  String _validateResponse(String response, AIModelAttempt attempt) {
    final trimmed = response.trim();
    if (trimmed.isEmpty) {
      throw AIEmptyResponseException(
        '${attempt.provider.label} returned an empty response.',
      );
    }
    return trimmed;
  }

  AIAttemptFailure _failure({
    required AIModelAttempt attempt,
    required int retry,
    required Duration duration,
    required AIException error,
    required StackTrace stackTrace,
  }) {
    developer.log(
      'AI request failed',
      name: 'AIService',
      error: error,
      stackTrace: stackTrace,
      time: DateTime.now(),
      sequenceNumber: retry,
      level: 900,
    );

    developer.log(
      'provider=${attempt.provider.label} model=${attempt.model} '
      'durationMs=${duration.inMilliseconds} retry=$retry '
      'error=${error.message}',
      name: 'AIService',
    );

    return AIAttemptFailure(
      provider: attempt.provider,
      model: attempt.model,
      retry: retry,
      duration: duration,
      message: error.message,
    );
  }

  void _logAttemptStart(AIModelAttempt attempt, int retry) {
    developer.log(
      'AI request started: provider=${attempt.provider.label} '
      'model=${attempt.model} retry=$retry',
      name: 'AIService',
    );
  }

  void _logAttemptSuccess(
    AIModelAttempt attempt,
    int retry,
    Duration duration,
  ) {
    developer.log(
      'AI request succeeded: provider=${attempt.provider.label} '
      'model=${attempt.model} durationMs=${duration.inMilliseconds} '
      'retry=$retry',
      name: 'AIService',
    );
  }

  void _logFailover(AIModelAttempt attempt, AIAttemptFailure failure) {
    developer.log(
      'AI failover triggered after provider=${attempt.provider.label} '
      'model=${attempt.model}: ${failure.message}',
      name: 'AIService',
      level: 800,
    );
  }
}

class _AttemptResult {
  const _AttemptResult({
    this.response,
    this.failures = const [],
  });

  final String? response;
  final List<AIAttemptFailure> failures;
}
