/// Supported AI providers for the ILAW Lesson Plan Generator.
enum AIProvider {
  gemini,
  openRouter,
  groq,
}

extension AIProviderLabel on AIProvider {
  String get label {
    switch (this) {
      case AIProvider.gemini:
        return 'Google Gemini';
      case AIProvider.openRouter:
        return 'OpenRouter';
      case AIProvider.groq:
        return 'Groq';
    }
  }
}

/// Central model identifiers used by the AI failover pipeline.
///
/// Provider APIs may require exact model slugs. Keep all model names here so
/// provider services and failover orchestration do not duplicate string values.
class AIModels {
  const AIModels._();

  static const gemini25Pro = 'gemini-2.5-pro';

  static const openRouterGpt55 = 'openai/gpt-5.5';
  static const openRouterGemini25Pro = 'google/gemini-2.5-pro';
  static const openRouterQwen3235B = 'qwen/qwen3-235b';

  static const groqQwen3627B = 'qwen/qwen3.6-27b';
  static const groqLlama3370BVersatile = 'llama-3.3-70b-versatile';
}

/// A single provider/model attempt in the failover chain.
class AIModelAttempt {
  const AIModelAttempt({
    required this.provider,
    required this.model,
  });

  final AIProvider provider;
  final String model;
}

/// Failure metadata captured for observability and final error reporting.
class AIAttemptFailure {
  const AIAttemptFailure({
    required this.provider,
    required this.model,
    required this.retry,
    required this.duration,
    required this.message,
  });

  final AIProvider provider;
  final String model;
  final int retry;
  final Duration duration;
  final String message;

  @override
  String toString() {
    return '${provider.label} / $model failed after '
        '${duration.inMilliseconds}ms on retry $retry: $message';
  }
}

/// Provider adapter contract.
///
/// UI code should never depend on provider-specific services directly. Each
/// provider service implements this interface and is called only by AIService.
abstract class AIProviderClient {
  AIProvider get provider;

  Future<String> generateText({
    required String prompt,
    required String model,
  });
}

/// Input object used by PromptBuilder to create the final ILAW prompt.
///
/// This intentionally allows optional fields because teachers may begin from
/// partial lesson details, uploaded references, or manually entered standards.
class ILawLessonInput {
  const ILawLessonInput({
    required this.topic,
    required this.gradeLevel,
    required this.learningArea,
    required this.term,
    required this.templateMode,
    this.teacherName,
    this.section,
    this.duration,
    this.languagePreference = 'English',
    this.languageSupport,
    this.contentStandard,
    this.performanceStandard,
    this.learningCompetency,
    this.competencyCode,
    this.objectives,
    this.teacherInstructions,
    this.referenceText,
  });

  final String topic;
  final String gradeLevel;
  final String learningArea;
  final String term;
  final String templateMode;
  final String? teacherName;
  final String? section;
  final String? duration;
  final String languagePreference;
  final String? languageSupport;
  final String? contentStandard;
  final String? performanceStandard;
  final String? learningCompetency;
  final String? competencyCode;
  final String? objectives;
  final String? teacherInstructions;
  final String? referenceText;

  int get sessionCount => templateMode == '4-day' ? 4 : 5;

  Map<String, Object?> toJson() {
    return {
      'topic': topic,
      'gradeLevel': gradeLevel,
      'learningArea': learningArea,
      'term': term,
      'templateMode': templateMode,
      'teacherName': teacherName,
      'section': section,
      'duration': duration,
      'languagePreference': languagePreference,
      'languageSupport': languageSupport,
      'contentStandard': contentStandard,
      'performanceStandard': performanceStandard,
      'learningCompetency': learningCompetency,
      'competencyCode': competencyCode,
      'objectives': objectives,
      'teacherInstructions': teacherInstructions,
      'referenceText': referenceText,
    };
  }
}
